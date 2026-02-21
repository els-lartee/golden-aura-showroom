import { describe, it, expect } from "vitest";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  HAND_TRIANGLE_INDICES,
  HAND_TRIANGLE_COUNT,
  landmarksToPositions,
} from "@/lib/handMeshTopology";

describe("HAND_TRIANGLE_INDICES", () => {
  it("has a length divisible by 3 (each triangle = 3 indices)", () => {
    expect(HAND_TRIANGLE_INDICES.length % 3).toBe(0);
  });

  it("matches the declared HAND_TRIANGLE_COUNT", () => {
    expect(HAND_TRIANGLE_INDICES.length / 3).toBe(HAND_TRIANGLE_COUNT);
  });

  it("contains only valid landmark indices (0–20)", () => {
    for (const idx of HAND_TRIANGLE_INDICES) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(21);
    }
  });

  it("has no degenerate triangles (all 3 indices in a triangle are distinct)", () => {
    for (let i = 0; i < HAND_TRIANGLE_INDICES.length; i += 3) {
      const a = HAND_TRIANGLE_INDICES[i];
      const b = HAND_TRIANGLE_INDICES[i + 1];
      const c = HAND_TRIANGLE_INDICES[i + 2];
      expect(a).not.toBe(b);
      expect(b).not.toBe(c);
      expect(a).not.toBe(c);
    }
  });

  it("covers all 21 landmarks (every landmark is used by at least one triangle)", () => {
    const used = new Set(HAND_TRIANGLE_INDICES);
    for (let i = 0; i < 21; i++) {
      expect(used.has(i)).toBe(true);
    }
  });
});

describe("landmarksToPositions", () => {
  const makeLandmarks = (): NormalizedLandmark[] =>
    Array.from({ length: 21 }, (_, i) => ({
      x: i / 21,
      y: i / 21,
      z: (i * 0.01),
    }));

  const videoDims = { width: 1280, height: 960 };

  it("returns a Float32Array of length 63", () => {
    const result = landmarksToPositions(makeLandmarks(), videoDims);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(63);
  });

  it("maps landmark 0 at (0, 0, 0) to (0, height, 0) in pixel coords", () => {
    const lms = makeLandmarks();
    lms[0] = { x: 0, y: 0, z: 0 };
    const pos = landmarksToPositions(lms, videoDims);
    expect(pos[0]).toBeCloseTo(0);
    expect(pos[1]).toBeCloseTo(videoDims.height);
    expect(pos[2]).toBeCloseTo(0);
  });

  it("maps landmark at (0.5, 0.5, 0) to center of video", () => {
    const lms = makeLandmarks();
    lms[3] = { x: 0.5, y: 0.5, z: 0 };
    const pos = landmarksToPositions(lms, videoDims);
    const base = 3 * 3;
    expect(pos[base]).toBeCloseTo(videoDims.width / 2);
    expect(pos[base + 1]).toBeCloseTo(videoDims.height / 2);
    expect(pos[base + 2]).toBeCloseTo(0);
  });

  it("z component scales by video width", () => {
    const lms = makeLandmarks();
    lms[0] = { x: 0.5, y: 0.5, z: 0.1 };
    const pos = landmarksToPositions(lms, videoDims);
    expect(pos[2]).toBeCloseTo(0.1 * videoDims.width);
  });

  it("maps (1, 1, 0) to (width, 0, 0)", () => {
    const lms = makeLandmarks();
    lms[0] = { x: 1, y: 1, z: 0 };
    const pos = landmarksToPositions(lms, videoDims);
    expect(pos[0]).toBeCloseTo(videoDims.width);
    expect(pos[1]).toBeCloseTo(0);
    expect(pos[2]).toBeCloseTo(0);
  });

  it("all output values are finite numbers", () => {
    const pos = landmarksToPositions(makeLandmarks(), videoDims);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isFinite(pos[i])).toBe(true);
    }
  });
});
