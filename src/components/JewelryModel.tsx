import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Group, Matrix4, Quaternion, Vector3 } from "three";
import { OneEuroFilter, OneEuroFilter3, OneEuroFilter4 } from "@/lib/oneEuroFilter";
import { getAnchorConfig, type JewelryType } from "@/lib/jewelryConfig";

export interface JewelryModelProps {
  modelUrl: string;
  landmarksRef: MutableRefObject<NormalizedLandmark[] | null>;
  /** World-space landmarks (meters) for rotation, scale, and palm detection. */
  worldLandmarksRef: MutableRefObject<Landmark[] | null>;
  /** Hand label ref for palm-normal sign correction per handedness. */
  handednessRef: MutableRefObject<"Left" | "Right" | null>;
  /** Camera vertical FOV ref (degrees) for depth estimation. */
  fovRef: MutableRefObject<number>;
  /** Which type of jewelry to anchor. Determines default landmarks, scale, and offset. */
  jewelryType?: JewelryType;
  depthScale?: number;
  /** Override anchor config defaults — see JewelryAnchorConfig for descriptions. */
  baseScale?: number;
  scaleFactor?: number;
  palmScaleFactor?: number;
  minScale?: number;
  maxScale?: number;
  surfaceOffset?: number;
  /** One Euro Filter: minimum cutoff frequency (lower = smoother when slow). */
  filterMinCutoff?: number;
  /** One Euro Filter: speed coefficient (higher = more responsive when fast). */
  filterBeta?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Estimate camera-to-hand depth by comparing a known physical distance
 * (from worldLandmarks, in meters) to its projected size on screen
 * (from normalised landmarks in [0,1]).
 *
 * depth ≈ physicalSize / (projectedSize × 2 × tan(fov/2))
 *
 * Returns the distance in R3F world units (≈ meters for our camera setup).
 */
function estimateDepth(
  normA: NormalizedLandmark,
  normB: NormalizedLandmark,
  worldA: Landmark,
  worldB: Landmark,
  fovDeg: number,
): number {
  // Physical (world) 3D distance between ref landmarks
  const dx = worldB.x - worldA.x;
  const dy = worldB.y - worldA.y;
  const dz = worldB.z - worldA.z;
  const physicalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Projected 2D distance (normalised screen coords, use only x/y)
  const sx = normB.x - normA.x;
  const sy = normB.y - normA.y;
  const projectedDist = Math.sqrt(sx * sx + sy * sy);

  if (projectedDist < 1e-6) return 0.5; // fallback — hand fills screen or degenerate

  const halfFovRad = ((fovDeg / 2) * Math.PI) / 180;
  const depth = physicalDist / (projectedDist * 2 * Math.tan(halfFovRad));

  // Clamp to sane range (0.15m–2m typical arm's length)
  return clamp(depth, 0.15, 2.0);
}

export const JewelryModel = ({
  modelUrl,
  landmarksRef,
  worldLandmarksRef,
  handednessRef,
  fovRef,
  jewelryType = "ring",
  depthScale = 2,
  baseScale: baseScaleOverride,
  scaleFactor: scaleFactorOverride,
  palmScaleFactor: palmScaleFactorOverride,
  minScale: minScaleOverride,
  maxScale: maxScaleOverride,
  surfaceOffset: surfaceOffsetOverride,
  filterMinCutoff = 1.0,
  filterBeta = 0.007,
}: JewelryModelProps) => {
  const config = getAnchorConfig(jewelryType);

  // Allow prop overrides; fall back to anchor config defaults
  const baseScale = baseScaleOverride ?? config.baseScale;
  const scaleFactor = scaleFactorOverride ?? config.scaleFactor;
  const palmScaleFactor = palmScaleFactorOverride ?? config.palmScaleFactor;
  const minScale = minScaleOverride ?? config.minScale;
  const maxScale = maxScaleOverride ?? config.maxScale;
  const surfaceOffset = surfaceOffsetOverride ?? config.surfaceOffset;

  const gltf = useGLTF(modelUrl);
  const modelRef = useRef<Group>(null);
  const { viewport, camera } = useThree();

  // One Euro Filters — instantiated once, persist across frames
  const posFilter = useRef<OneEuroFilter3 | null>(null);
  const quatFilter = useRef<OneEuroFilter4 | null>(null);
  const scaleFilter = useRef<OneEuroFilter | null>(null);

  if (!posFilter.current) {
    const opts = { minCutoff: filterMinCutoff, beta: filterBeta };
    posFilter.current = new OneEuroFilter3(opts);
    quatFilter.current = new OneEuroFilter4(opts);
    scaleFilter.current = new OneEuroFilter(opts);
  }

  // Track palm-facing state with hysteresis to avoid flicker
  const palmFacingRef = useRef(false);

  const up = useMemo(() => new Vector3(0, 1, 0), []);
  const targetPos = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);
  const quat = useMemo(() => new Quaternion(), []);
  const scaleVec = useMemo(() => new Vector3(), []);
  const palmVec = useMemo(() => new Vector3(), []);
  const indexVec = useMemo(() => new Vector3(), []);
  const pinkyVec = useMemo(() => new Vector3(), []);
  const outwardVec = useMemo(() => new Vector3(), []);
  const rotMatrix = useMemo(() => new Matrix4(), []);
  const correctedNormal = useMemo(() => new Vector3(), []);
  const sideVec = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const model = modelRef.current;
    const landmarks = landmarksRef.current;
    const worldLandmarks = worldLandmarksRef.current;
    if (!model || !landmarks || landmarks.length <= 17) {
      if (model) model.visible = false;
      // Reset filters when hand disappears so we don't carry stale state
      posFilter.current?.reset();
      quatFilter.current?.reset();
      scaleFilter.current?.reset();
      return;
    }

    model.visible = true;

    // ── Resolve anchor & direction landmarks from config ──
    const anchorLMs = config.anchorLandmarks.map((i) => landmarks[i]);
    const fromLM = landmarks[config.directionLandmarks[0]];
    const toLM = landmarks[config.directionLandmarks[1]];
    const wrist = landmarks[0];
    const indexKnuckle = landmarks[5];

    // World-space landmarks for rotation, scale, and palm detection
    const hasWorld = worldLandmarks && worldLandmarks.length > 17;
    const wWorld = hasWorld ? worldLandmarks : null;

    // ── Rotation from world landmarks (or fall back to normalized) ──
    if (wWorld) {
      const wFrom = wWorld[config.directionLandmarks[0]];
      const wTo = wWorld[config.directionLandmarks[1]];
      const wWrist = wWorld[0];
      const wIndex = wWorld[5];
      const wPinky = wWorld[17];

      // Direction vector from world landmarks (real 3D, no projection distortion)
      // MediaPipe world coords: x-right, y-up, z-toward-camera
      // Three.js: x-right, y-up, z-toward-viewer — same convention
      dir.set(wTo.x - wFrom.x, wTo.y - wFrom.y, wTo.z - wFrom.z);
      dir.normalize();

      // Build palm orientation basis from world landmarks
      indexVec.set(wIndex.x - wWrist.x, wIndex.y - wWrist.y, wIndex.z - wWrist.z).normalize();
      pinkyVec.set(wPinky.x - wWrist.x, wPinky.y - wWrist.y, wPinky.z - wWrist.z).normalize();

      // Initial palm normal from cross product of index and pinky vectors
      palmVec.copy(indexVec).cross(pinkyVec).normalize();

      // For Left hand in MediaPipe, the cross product index×pinky may point
      // away from the palm. Normalize so palmNormal always points
      // toward the viewer when the palm faces the camera.
      // MediaPipe "Right" label on front camera = user's right hand, palm faces camera → normal.z > 0
      // MediaPipe "Left" label on front camera = user's left hand, palm faces camera → normal.z < 0 (needs flip)
      const handLabel = handednessRef.current;
      if (handLabel === "Left") {
        palmVec.negate();
      }

      // ── Palm vs backhand detection ──
      // palmVec.z > 0 → palm faces camera; palmVec.z < 0 → backhand faces camera
      // Use hysteresis to prevent flickering at edge angles
      const PALM_THRESHOLD = 0.15;
      if (palmFacingRef.current) {
        // Currently palm-facing, require z < -threshold to switch to backhand
        if (palmVec.z < -PALM_THRESHOLD) palmFacingRef.current = false;
      } else {
        // Currently backhand-facing, require z > +threshold to switch to palm
        if (palmVec.z > PALM_THRESHOLD) palmFacingRef.current = true;
      }

      // ── Orthogonal basis construction (Gram-Schmidt) ──
      // Primary axis: dir (finger direction) — preserved exactly
      // Secondary reference: palmVec
      // Derive side = cross(dir, palmVec), then correctedNormal = cross(side, dir)
      // to ensure a right-handed orthonormal frame (det = +1)
      sideVec.crossVectors(dir, palmVec).normalize();
      correctedNormal.crossVectors(sideVec, dir).normalize();

      rotMatrix.makeBasis(sideVec, dir, correctedNormal);
      quat.setFromRotationMatrix(rotMatrix);

      // When palm faces camera, rotate 180° around finger axis so the ring
      // design faces the viewer from the palm side
      if (palmFacingRef.current) {
        const flipQuat = new Quaternion().setFromAxisAngle(dir, Math.PI);
        quat.premultiply(flipQuat);
      }
    } else {
      // Fallback: use normalized landmarks (legacy path)
      dir.set(toLM.x - fromLM.x, -(toLM.y - fromLM.y), -(toLM.z - fromLM.z));
      dir.normalize();
      quat.setFromUnitVectors(up, dir);
    }

    // ── Position: screen x/y from normalized landmarks + depth from world landmarks ──
    const { width, height } = viewport;
    const cameraZ = camera.position.z; // camera distance from z=0 reference plane
    let anchorX = 0, anchorY = 0;
    for (const lm of anchorLMs) {
      anchorX += lm.x;
      anchorY += lm.y;
    }
    anchorX /= anchorLMs.length;
    anchorY /= anchorLMs.length;

    // Estimate depth using physical vs projected size
    let depth: number;
    if (wWorld) {
      const [refA, refB] = config.depthReferenceLandmarks;
      depth = estimateDepth(landmarks[refA], landmarks[refB], wWorld[refA], wWorld[refB], fovRef.current);
    } else {
      // Fallback: use normalized z with depthScale
      let anchorZ = 0;
      for (const lm of anchorLMs) anchorZ += lm.z;
      anchorZ /= anchorLMs.length;
      depth = anchorZ * depthScale;
    }

    // The viewport dimensions are for the z=0 plane (distance cameraZ from camera).
    // The ring sits at z = -depth (distance cameraZ + depth from camera).
    // Scale x/y mapping by the ratio so it projects to the correct screen position.
    const depthRatio = cameraZ > 0 ? (cameraZ + depth) / cameraZ : 1;

    targetPos.set(
      (anchorX - 0.5) * width * depthRatio,
      -(anchorY - 0.5) * height * depthRatio,
      -depth,
    );

    // Surface offset: push the model outward from the bone centerline
    if (wWorld && surfaceOffset !== 0) {
      // Outward direction = cross(dir, correctedNormal)
      outwardVec.crossVectors(dir, correctedNormal).normalize();
      // When palm faces camera, flip offset to the visible side
      if (palmFacingRef.current) outwardVec.negate();
      targetPos.addScaledVector(outwardVec, surfaceOffset);
    } else if (!wWorld && surfaceOffset !== 0) {
      // Legacy fallback: approximate outward from normalized landmarks
      const pinkyKnuckle = landmarks[17];
      if (wrist && indexKnuckle && pinkyKnuckle) {
        const niVec = new Vector3(indexKnuckle.x - wrist.x, -(indexKnuckle.y - wrist.y), -(indexKnuckle.z - wrist.z)).normalize();
        const npVec = new Vector3(pinkyKnuckle.x - wrist.x, -(pinkyKnuckle.y - wrist.y), -(pinkyKnuckle.z - wrist.z)).normalize();
        const nPalmNormal = new Vector3().copy(niVec).cross(npVec).normalize();
        outwardVec.crossVectors(dir, nPalmNormal).normalize();
        targetPos.addScaledVector(outwardVec, surfaceOffset);
      }
    }

    // Axial offset: push along the negative direction axis (e.g., toward forearm for bracelets)
    if (config.axialOffset !== 0) {
      targetPos.addScaledVector(dir, config.axialOffset);
    }

    // Apply One Euro Filter for smooth, responsive tracking
    const t = performance.now() / 1000; // seconds

    const [fx, fy, fz] = posFilter.current!.filter(targetPos.x, targetPos.y, targetPos.z, t);
    model.position.set(fx, fy, fz);

    const [qx, qy, qz, qw] = quatFilter.current!.filter(quat.x, quat.y, quat.z, quat.w, t);
    model.quaternion.set(qx, qy, qz, qw).normalize();

    // ── Scale: use world landmarks for perspective-correct sizing ──
    let rawScale: number;
    if (wWorld) {
      // Use 2D projected distances (from normalized landmarks, x/y only)
      // so that scale responds to camera distance naturally
      const fromN = landmarks[config.directionLandmarks[0]];
      const toN = landmarks[config.directionLandmarks[1]];
      const segmentLength2D = Math.max(1e-4, Math.sqrt(
        (toN.x - fromN.x) ** 2 + (toN.y - fromN.y) ** 2,
      ));

      const palmSpan2D = wrist && indexKnuckle
        ? Math.max(1e-4, Math.sqrt(
            (indexKnuckle.x - wrist.x) ** 2 + (indexKnuckle.y - wrist.y) ** 2,
          ))
        : 0;

      rawScale = clamp(
        baseScale + segmentLength2D * scaleFactor + palmSpan2D * palmScaleFactor,
        minScale,
        maxScale,
      );
    } else {
      // Legacy fallback
      const segmentLength = Math.max(1e-4, dir.length());
      const palmSpan = wrist && indexKnuckle
        ? Math.max(1e-4, palmVec.set(
            indexKnuckle.x - wrist.x,
            -(indexKnuckle.y - wrist.y),
            -(indexKnuckle.z - wrist.z),
          ).length())
        : 0;
      rawScale = clamp(
        baseScale + segmentLength * scaleFactor + palmSpan * palmScaleFactor,
        minScale,
        maxScale,
      );
    }

    const filteredScale = scaleFilter.current!.filter(rawScale, t);
    scaleVec.setScalar(filteredScale);
    model.scale.copy(scaleVec);
  });

  return (
    <group renderOrder={1}>
      <primitive ref={modelRef} object={gltf.scene} dispose={null} />
    </group>
  );
};

export default JewelryModel;
