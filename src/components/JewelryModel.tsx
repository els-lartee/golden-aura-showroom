import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Box3, Group, Matrix4, Quaternion, Sphere, Vector3 } from "three";
import { OneEuroFilter, OneEuroFilter3, OneEuroFilter4 } from "@/lib/oneEuroFilter";
import { getAnchorConfig, type JewelryType } from "@/lib/jewelryConfig";

export interface JewelryModelProps {
  modelUrl: string;
  landmarksRef: MutableRefObject<NormalizedLandmark[] | null>;
  videoDimsRef: MutableRefObject<{ width: number; height: number }>;
  jewelryType?: JewelryType;
  /** Override anchor config scaleFactor. */
  scaleFactor?: number;
  /** One Euro Filter: minimum cutoff frequency (lower = smoother when slow). */
  filterMinCutoff?: number;
  /** One Euro Filter: speed coefficient (higher = more responsive when fast). */
  filterBeta?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function lmToPixel(lm: NormalizedLandmark, w: number, h: number, out: Vector3): Vector3 {
  return out.set(lm.x * w, (1.0 - lm.y) * h, lm.z * w);
}

function safeNormalize(v: Vector3, fallback: Vector3): Vector3 {
  const len = v.length();
  if (len < 1e-8) return v.copy(fallback);
  return v.divideScalar(len);
}

export const JewelryModel = ({
  modelUrl,
  landmarksRef,
  videoDimsRef,
  jewelryType = "ring",
  scaleFactor: scaleFactorOverride,
  filterMinCutoff = 1.0,
  filterBeta = 0.007,
}: JewelryModelProps) => {
  const config = getAnchorConfig(jewelryType);
  const scaleFactor = scaleFactorOverride ?? config.scaleFactor;

  const gltf = useGLTF(modelUrl);
  const modelRef = useRef<Group>(null);
  const normalizedScaleRef = useRef(1);

  // Normalize model on load: scale so bounding-sphere diameter = 1, center at origin
  useEffect(() => {
    const scene = gltf.scene;
    const bbox = new Box3().setFromObject(scene);
    const sphere = new Sphere();
    bbox.getBoundingSphere(sphere);
    normalizedScaleRef.current = 1.0 / (sphere.radius * 2 || 1);

    const center = bbox.getCenter(new Vector3());
    scene.position.sub(center);
  }, [gltf.scene]);

  // One Euro Filters
  const posFilter = useRef<OneEuroFilter3 | null>(null);
  const quatFilter = useRef<OneEuroFilter4 | null>(null);
  const scaleFilter = useRef<OneEuroFilter | null>(null);

  if (!posFilter.current) {
    const opts = { minCutoff: filterMinCutoff, beta: filterBeta };
    posFilter.current = new OneEuroFilter3(opts);
    quatFilter.current = new OneEuroFilter4(opts);
    scaleFilter.current = new OneEuroFilter(opts);
  }

  // Reusable Vector3/Quaternion/Matrix4 to avoid per-frame allocation
  const _fallbackUp = useMemo(() => new Vector3(0, 1, 0), []);
  const _from = useMemo(() => new Vector3(), []);
  const _to = useMemo(() => new Vector3(), []);
  const _scaleRef = useMemo(() => new Vector3(), []);
  const _wrist = useMemo(() => new Vector3(), []);
  const _indexMcp = useMemo(() => new Vector3(), []);
  const _pinkyMcp = useMemo(() => new Vector3(), []);
  const _boneDir = useMemo(() => new Vector3(), []);
  const _wristToIndex = useMemo(() => new Vector3(), []);
  const _wristToPinky = useMemo(() => new Vector3(), []);
  const _rawNormal = useMemo(() => new Vector3(), []);
  const _palmNormal = useMemo(() => new Vector3(), []);
  const _lateral = useMemo(() => new Vector3(), []);
  const _pos = useMemo(() => new Vector3(), []);
  const _tmpA = useMemo(() => new Vector3(), []);
  const _tmpB = useMemo(() => new Vector3(), []);
  const _rotMat = useMemo(() => new Matrix4(), []);
  const _quat = useMemo(() => new Quaternion(), []);

  useFrame(() => {
    const model = modelRef.current;
    const landmarks = landmarksRef.current;
    const { width: w, height: h } = videoDimsRef.current;
    if (!model || !landmarks || landmarks.length <= 17 || !w || !h) {
      if (model) model.visible = false;
      posFilter.current?.reset();
      quatFilter.current?.reset();
      scaleFilter.current?.reset();
      return;
    }

    model.visible = true;

    // -- Position: average anchor landmarks in pixel coords --
    _pos.set(0, 0, 0);
    for (const idx of config.anchorLandmarks) {
      lmToPixel(landmarks[idx], w, h, _tmpA);
      _pos.add(_tmpA);
    }
    _pos.divideScalar(config.anchorLandmarks.length);

    // -- Bone direction (model Y axis) from directionLandmarks --
    lmToPixel(landmarks[config.directionLandmarks[0]], w, h, _from);
    lmToPixel(landmarks[config.directionLandmarks[1]], w, h, _to);
    _boneDir.subVectors(_to, _from);
    safeNormalize(_boneDir, _fallbackUp);

    // -- Palm normal from wide palm triangle (landmarks 0, 5, 17) --
    // Negated so it points out of the back of the hand (knuckle side).
    lmToPixel(landmarks[0], w, h, _wrist);
    lmToPixel(landmarks[5], w, h, _indexMcp);
    lmToPixel(landmarks[17], w, h, _pinkyMcp);

    _wristToIndex.subVectors(_indexMcp, _wrist);
    _wristToPinky.subVectors(_pinkyMcp, _wrist);
    _rawNormal.crossVectors(_wristToIndex, _wristToPinky);
    safeNormalize(_rawNormal, _fallbackUp);
    _rawNormal.negate();

    // -- Project palm normal perpendicular to boneDir (model Z axis) --
    const dot = _rawNormal.dot(_boneDir);
    _palmNormal.copy(_rawNormal).addScaledVector(_boneDir, -dot);
    safeNormalize(_palmNormal, _fallbackUp);

    // -- Lateral = cross(boneDir, palmNormal) (model X axis) --
    _lateral.crossVectors(_boneDir, _palmNormal).normalize();

    // -- Rotation: makeBasis(X=lateral, Y=boneDir, Z=palmNormal) --
    _rotMat.makeBasis(_lateral, _boneDir, _palmNormal);
    _quat.setFromRotationMatrix(_rotMat);

    // -- Axial offset along negative direction axis --
    if (config.axialOffset !== 0) {
      _pos.addScaledVector(_boneDir, config.axialOffset);
    }

    // -- Scale: knuckle width between scaleReferenceLandmarks --
    lmToPixel(landmarks[config.scaleReferenceLandmarks[0]], w, h, _tmpA);
    lmToPixel(landmarks[config.scaleReferenceLandmarks[1]], w, h, _tmpB);
    const knuckleWidth = _tmpA.distanceTo(_tmpB);
    const targetScale = clamp(
      knuckleWidth * normalizedScaleRef.current * scaleFactor,
      config.minScale,
      config.maxScale,
    );

    // -- Apply One Euro Filter --
    const t = performance.now() / 1000;

    const [fx, fy, fz] = posFilter.current!.filter(_pos.x, _pos.y, _pos.z, t);
    model.position.set(fx, fy, fz);

    const [qx, qy, qz, qw] = quatFilter.current!.filter(_quat.x, _quat.y, _quat.z, _quat.w, t);
    model.quaternion.set(qx, qy, qz, qw).normalize();

    const filteredScale = scaleFilter.current!.filter(targetScale, t);
    _scaleRef.setScalar(filteredScale);
    model.scale.copy(_scaleRef);
  });

  return (
    <group renderOrder={1}>
      <primitive ref={modelRef} object={gltf.scene} dispose={null} />
    </group>
  );
};

export default JewelryModel;
