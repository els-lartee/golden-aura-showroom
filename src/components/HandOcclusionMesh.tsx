/**
 * HandOcclusionMesh — renders an invisible hand geometry that writes
 * to the depth buffer only.  This occludes the ring model behind
 * finger edges so it appears to wrap around the finger naturally,
 * rather than always rendering on top.
 *
 * The mesh is a BufferGeometry with 21 vertices (one per MediaPipe
 * landmark) and a fixed triangle index buffer from handMeshTopology.
 * Vertex positions are updated every frame in useFrame().
 *
 * Material setup:
 *  - colorWrite: false  — invisible (no pixels drawn)
 *  - depthWrite: true   — writes to z-buffer
 *  - renderOrder: 0     — renders before the ring (renderOrder 1)
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
} from "three";
import { HAND_TRIANGLE_INDICES, landmarksToPositions } from "@/lib/handMeshTopology";

export interface HandOcclusionMeshProps {
  landmarksRef: MutableRefObject<NormalizedLandmark[] | null>;
  videoDimsRef: MutableRefObject<{ width: number; height: number }>;
}

export const HandOcclusionMesh = ({
  landmarksRef,
  videoDimsRef,
}: HandOcclusionMeshProps) => {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32BufferAttribute(new Float32Array(21 * 3), 3);
    positions.setUsage(35048); // gl.DYNAMIC_DRAW
    geo.setAttribute("position", positions);
    geo.setIndex(new Uint16BufferAttribute(new Uint16Array(HAND_TRIANGLE_INDICES), 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        side: DoubleSide,
      }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    const landmarks = landmarksRef.current;
    const { width, height } = videoDimsRef.current;

    if (!mesh || !landmarks || landmarks.length < 21 || !width || !height) {
      if (mesh) mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const positions = landmarksToPositions(landmarks, { width, height });
    const attr = geometry.getAttribute("position") as Float32BufferAttribute;
    attr.set(positions);
    attr.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      renderOrder={0}
      frustumCulled={false}
    />
  );
};

export default HandOcclusionMesh;
