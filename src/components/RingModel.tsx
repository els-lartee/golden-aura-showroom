import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Group, Matrix4, Quaternion, Vector3 } from "three";

export interface RingModelProps {
  modelUrl: string;
  landmarksRef: MutableRefObject<NormalizedLandmark[] | null>;
  smoothing?: number;
  depthScale?: number;
  baseScale?: number;
  fingerScaleFactor?: number;
  palmScaleFactor?: number;
  minScale?: number;
  maxScale?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const RingModel = ({
  modelUrl,
  landmarksRef,
  smoothing = 0.2,
  depthScale = 2,
  // Scale heuristics: mix finger joint length and palm span so size responds to distance
  baseScale = 0.1,
  fingerScaleFactor = 2.6,
  palmScaleFactor = 2,
  minScale = 0.07,
  maxScale = 0.28,
}: RingModelProps) => {
  const gltf = useGLTF(modelUrl);
  const ringRef = useRef<Group>(null);
  const { viewport } = useThree();

  const up = useMemo(() => new Vector3(0, 1, 0), []);
  const targetPos = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);
  const quat = useMemo(() => new Quaternion(), []);
  const scaleVec = useMemo(() => new Vector3(), []);
  const palmVec = useMemo(() => new Vector3(), []);
  const indexVec = useMemo(() => new Vector3(), []);
  const pinkyVec = useMemo(() => new Vector3(), []);
  const rotMatrix = useMemo(() => new Matrix4(), []);

  useFrame(() => {
    const ring = ringRef.current;
    const landmarks = landmarksRef.current;
    if (!ring || !landmarks || landmarks.length <= 14) {
      if (ring) ring.visible = false;
      return;
    }

    ring.visible = true;
    const mcp = landmarks[13];
    const pip = landmarks[14];
    const wrist = landmarks[0];
    const indexKnuckle = landmarks[5];
    const pinkyKnuckle = landmarks[17];

    dir.set(pip.x - mcp.x, -(pip.y - mcp.y), -(pip.z - mcp.z));
    const fingerLength = Math.max(1e-4, dir.length());
    dir.normalize();

    // Build an orientation basis using palm plane to stabilize roll
    const hasPalm = wrist && indexKnuckle && pinkyKnuckle;
    if (hasPalm) {
      indexVec.set(indexKnuckle.x - wrist.x, -(indexKnuckle.y - wrist.y), -(indexKnuckle.z - wrist.z)).normalize();
      pinkyVec.set(pinkyKnuckle.x - wrist.x, -(pinkyKnuckle.y - wrist.y), -(pinkyKnuckle.z - wrist.z)).normalize();

      // Palm normal from index and pinky gives a stable roll axis
      const palmNormal = palmVec.copy(indexVec).cross(pinkyVec).normalize();
      // Side axis perpendicular to finger direction
      const side = palmNormal.clone().cross(dir).normalize();

      rotMatrix.makeBasis(side, dir, palmNormal);
      quat.setFromRotationMatrix(rotMatrix);
    } else {
      quat.setFromUnitVectors(up, dir);
    }

    const { width, height } = viewport;
    targetPos.set((mcp.x - 0.5) * width, -(mcp.y - 0.5) * height, -mcp.z * depthScale);

    ring.position.lerp(targetPos, smoothing);
    ring.quaternion.slerp(quat, smoothing);

    const palmSpan = wrist && indexKnuckle
      ? Math.max(1e-4, palmVec.set(indexKnuckle.x - wrist.x, -(indexKnuckle.y - wrist.y), -(indexKnuckle.z - wrist.z)).length())
      : 0;

    const scale = clamp(
      baseScale + fingerLength * fingerScaleFactor + palmSpan * palmScaleFactor,
      minScale,
      maxScale,
    );
    scaleVec.setScalar(scale);
    ring.scale.lerp(scaleVec, smoothing);
  });

  return <primitive ref={ringRef} object={gltf.scene} dispose={null} />;
};

export default RingModel;
