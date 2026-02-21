/**
 * Hand mesh topology for occlusion rendering.
 *
 * Maps the 21 MediaPipe Hand landmarks into a triangle mesh that
 * approximates the visible surface of the hand. Used by the
 * HandOcclusionMesh component to write depth-only geometry so the
 * ring is naturally occluded by the finger.
 *
 * MediaPipe Hand Landmark indices:
 *   0  Wrist
 *   1  Thumb CMC        5  Index MCP       9  Middle MCP     13 Ring MCP      17 Pinky MCP
 *   2  Thumb MCP        6  Index PIP      10  Middle PIP     14 Ring PIP      18 Pinky PIP
 *   3  Thumb IP         7  Index DIP      11  Middle DIP     15 Ring DIP      19 Pinky DIP
 *   4  Thumb Tip        8  Index Tip      12  Middle Tip     16 Ring Tip      20 Pinky Tip
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ────────────────────────────────────────────────────────────
// Triangle index buffer (CCW winding when viewed from the front)
// ────────────────────────────────────────────────────────────

/**
 * Flat array of vertex indices — every 3 consecutive values form one triangle.
 * All indices are in [0, 20] referencing the 21 MediaPipe landmarks.
 *
 * Coverage:
 *  • Palm — fan from wrist (0) through MCP joints + thumb CMC
 *  • Each finger — quad strips from MCP→PIP→DIP→Tip, bridging to neighbor
 *  • Inter-finger webbing — triangles between adjacent finger bases
 */
export const HAND_TRIANGLE_INDICES: number[] = [
  // ── Palm fan (center = 0 wrist) ──────────────────────────
  0, 1, 5,   // wrist → thumb CMC → index MCP
  0, 5, 9,   // wrist → index MCP → middle MCP
  0, 9, 13,  // wrist → middle MCP → ring MCP
  0, 13, 17, // wrist → ring MCP → pinky MCP

  // ── Inter-finger webbing ─────────────────────────────────
  // Thumb CMC → Index MCP bridge
  1, 2, 5,
  2, 6, 5,

  // Index → Middle bridge
  5, 6, 9,
  6, 10, 9,

  // Middle → Ring bridge
  9, 10, 13,
  10, 14, 13,

  // Ring → Pinky bridge
  13, 14, 17,
  14, 18, 17,

  // ── Thumb (1→2→3→4) ──────────────────────────────────────
  1, 2, 3,
  2, 3, 4,

  // ── Index finger (5→6→7→8) ───────────────────────────────
  5, 6, 7,
  5, 7, 8,

  // ── Middle finger (9→10→11→12) ───────────────────────────
  9, 10, 11,
  9, 11, 12,

  // ── Ring finger (13→14→15→16) ────────────────────────────
  13, 14, 15,
  13, 15, 16,

  // ── Pinky finger (17→18→19→20) ───────────────────────────
  17, 18, 19,
  17, 19, 20,

  // ── Extra palm fill (between wrist and thumb base) ───────
  0, 1, 17, // close the palm outline (wrist → thumb CMC → pinky MCP)
];

/** Total number of triangles in the hand mesh. */
export const HAND_TRIANGLE_COUNT = HAND_TRIANGLE_INDICES.length / 3;

// ────────────────────────────────────────────────────────────
// Coordinate conversion
// ────────────────────────────────────────────────────────────

/**
 * Convert 21 MediaPipe normalized landmarks into a Float32Array of
 * 3D vertex positions (63 floats = 21 vertices × 3 components)
 * in pixel-coordinate space matching the orthographic camera setup.
 *
 * Mapping (same as JewelryModel's lmToPixel):
 *   x = landmark.x × width
 *   y = (1 − landmark.y) × height
 *   z = landmark.z × width
 *
 * @param landmarks  Array of 21 NormalizedLandmark from MediaPipe.
 * @param videoDims  `{ width, height }` — the video pixel dimensions.
 * @returns Float32Array of length 63.
 */
export const landmarksToPositions = (
  landmarks: NormalizedLandmark[],
  videoDims: { width: number; height: number },
): Float32Array => {
  const out = new Float32Array(21 * 3);
  const { width: w, height: h } = videoDims;

  for (let i = 0; i < 21; i++) {
    const lm = landmarks[i];
    const base = i * 3;
    out[base] = lm.x * w;
    out[base + 1] = (1.0 - lm.y) * h;
    out[base + 2] = lm.z * w;
  }

  return out;
};
