import { describe, it, expect, vi } from "vitest";

/**
 * JewelryModel component tests.
 *
 * Because JewelryModel is deeply coupled to React Three Fiber (useFrame, useThree,
 * useGLTF) which require a full WebGL canvas context, we test the core logic
 * by extracting and verifying the key algorithms it uses:
 *  - Scale clamping (ring and bracelet presets)
 *  - Position mapping (NDC → viewport, depth-adjusted)
 *  - Surface offset direction
 *  - Anchor averaging (single and multi-landmark)
 *  - Axial offset for bracelets
 *  - Orthogonal basis construction (Gram-Schmidt)
 *  - Palm vs backhand detection via palm-normal z-sign
 *  - One Euro Filter integration (tested separately in oneEuroFilter.test.ts)
 *
 * Full visual/integration testing of the rendered jewelry should be done manually
 * or via a Playwright/Cypress E2E test with a real browser and camera stub.
 */

import { Vector3, Quaternion, Matrix4 } from "three";
import { RING_ANCHOR, BRACELET_ANCHOR, getAnchorConfig } from "@/lib/jewelryConfig";

// ── Extracted logic from JewelryModel ─────────────────────────

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Simulate the scale computation from JewelryModel's useFrame callback (2D projected distances) */
function computeScale(
  segmentLength2D: number,
  palmSpan2D: number,
  opts: {
    baseScale?: number;
    fingerScaleFactor?: number;
    palmScaleFactor?: number;
    minScale?: number;
    maxScale?: number;
    sizeMultiplier?: number;
  } = {},
) {
  const {
    baseScale = 0.1,
    fingerScaleFactor = 2.6,
    palmScaleFactor = 2,
    minScale = 0.07,
    maxScale = 0.28,
    sizeMultiplier = 1,
  } = opts;
  const rawScale = clamp(
    baseScale + segmentLength2D * fingerScaleFactor + palmSpan2D * palmScaleFactor,
    minScale,
    maxScale,
  );
  const scaledMin = minScale * sizeMultiplier;
  const scaledMax = maxScale * sizeMultiplier;
  return clamp(rawScale * sizeMultiplier, scaledMin, scaledMax);
}

/** Simulate the NDC → viewport position mapping with depth adjustment */
function ndcToViewport(
  x: number,
  y: number,
  depth: number,
  viewport: { width: number; height: number },
  cameraZ: number = 2.8,
) {
  const depthRatio = cameraZ > 0 ? (cameraZ + depth) / cameraZ : 1;
  return {
    x: (x - 0.5) * viewport.width * depthRatio,
    y: -(y - 0.5) * viewport.height * depthRatio,
    z: -depth,
  };
}

/** Simulate the finger surface offset computation */
function computeSurfaceOffset(
  fingerDir: Vector3,
  palmNormal: Vector3,
  offset: number,
) {
  const outward = new Vector3().crossVectors(fingerDir, palmNormal).normalize();
  return outward.multiplyScalar(offset);
}

/** Build an orthogonal rotation basis from direction and palm reference vectors (Gram-Schmidt) */
function buildOrthogonalBasis(dir: Vector3, palmVec: Vector3): { side: Vector3; correctedNormal: Vector3; quat: Quaternion } {
  const side = new Vector3().crossVectors(dir, palmVec).normalize();
  const correctedNormal = new Vector3().crossVectors(side, dir).normalize();

  const matrix = new Matrix4().makeBasis(side, dir, correctedNormal);
  const quat = new Quaternion().setFromRotationMatrix(matrix);
  return { side, correctedNormal, quat };
}

/** Determine palm-facing state from palm normal z component */
function detectPalmFacing(palmNormalZ: number, currentlyFacing: boolean, threshold: number = 0.15): boolean {
  if (currentlyFacing) {
    return palmNormalZ >= -threshold; // stay palm-facing unless clearly backhand
  } else {
    return palmNormalZ > threshold; // switch to palm-facing only when clearly palm
  }
}

// ── Tests ─────────────────────────────────────────────────────

describe("JewelryModel — scale clamping (ring defaults)", () => {
  it("clamps below minScale", () => {
    const s = computeScale(0, 0, { baseScale: 0.01 });
    expect(s).toBe(0.07);
  });

  it("clamps above maxScale", () => {
    const s = computeScale(10, 10);
    expect(s).toBe(0.28);
  });

  it("produces a value within range for typical 2D inputs", () => {
    // Typical 2D projected distances for finger segment and palm span
    const s = computeScale(0.03, 0.05);
    expect(s).toBeGreaterThanOrEqual(0.07);
    expect(s).toBeLessThanOrEqual(0.28);
  });

  it("computes exact value for known inputs", () => {
    const segLen = 0.05;
    const palmSpan = 0.06;
    // 0.1 + 0.05*2.6 + 0.06*2 = 0.1 + 0.13 + 0.12 = 0.35 → clamped to 0.28
    const s = computeScale(segLen, palmSpan);
    expect(s).toBe(0.28);
  });

  it("scales up when size multiplier increases", () => {
    const base = computeScale(0.03, 0.05);
    const up = computeScale(0.03, 0.05, { sizeMultiplier: 1.2 });
    expect(up).toBeGreaterThan(base);
  });
});

describe("JewelryModel — NDC to viewport mapping (depth-adjusted)", () => {
  const viewport = { width: 10, height: 8 };

  it("maps center (0.5, 0.5) to origin at any depth", () => {
    const p = ndcToViewport(0.5, 0.5, 0.5, viewport);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(-0.5);
  });

  it("maps top-left (0, 0) with depth correction", () => {
    const depth = 0;
    const p = ndcToViewport(0, 0, depth, viewport, 2.8);
    // depthRatio = (2.8 + 0) / 2.8 = 1.0
    expect(p.x).toBeCloseTo(-5);
    expect(p.y).toBeCloseTo(4);
    expect(p.z).toBeCloseTo(0);
  });

  it("scales x/y outward when depth increases", () => {
    const pShallow = ndcToViewport(0.7, 0.3, 0, viewport, 2.8);
    const pDeep = ndcToViewport(0.7, 0.3, 1.0, viewport, 2.8);
    // At larger depth, x/y should be scaled further from center
    expect(Math.abs(pDeep.x)).toBeGreaterThan(Math.abs(pShallow.x));
    expect(Math.abs(pDeep.y)).toBeGreaterThan(Math.abs(pShallow.y));
  });
});

describe("JewelryModel — surface offset", () => {
  it("produces a perpendicular offset vector", () => {
    const fingerDir = new Vector3(0, 1, 0).normalize();
    const palmNormal = new Vector3(0, 0, 1).normalize();
    const offset = computeSurfaceOffset(fingerDir, palmNormal, 0.004);

    expect(offset.x).toBeCloseTo(0.004);
    expect(offset.y).toBeCloseTo(0);
    expect(offset.z).toBeCloseTo(0);
  });

  it("has the correct magnitude", () => {
    const fingerDir = new Vector3(1, 1, 0).normalize();
    const palmNormal = new Vector3(0, 0, 1).normalize();
    const offset = computeSurfaceOffset(fingerDir, palmNormal, 0.005);

    expect(offset.length()).toBeCloseTo(0.005);
  });

  it("returns zero vector when offset is 0", () => {
    const fingerDir = new Vector3(0, 1, 0);
    const palmNormal = new Vector3(0, 0, 1);
    const offset = computeSurfaceOffset(fingerDir, palmNormal, 0);

    expect(offset.length()).toBeCloseTo(0);
  });
});

describe("JewelryModel — orthogonal basis (Gram-Schmidt)", () => {
  it("produces an orthonormal basis from non-orthogonal inputs", () => {
    const dir = new Vector3(0, 1, 0.3).normalize();
    const palm = new Vector3(0.1, 0.1, 1).normalize();

    const { side, correctedNormal } = buildOrthogonalBasis(dir, palm);

    // All axes should be unit vectors
    expect(side.length()).toBeCloseTo(1);
    expect(correctedNormal.length()).toBeCloseTo(1);
    expect(dir.length()).toBeCloseTo(1);

    // All should be mutually perpendicular
    expect(side.dot(dir)).toBeCloseTo(0, 4);
    expect(side.dot(correctedNormal)).toBeCloseTo(0, 4);
    expect(dir.dot(correctedNormal)).toBeCloseTo(0, 4);
  });

  it("preserves the direction vector exactly", () => {
    const dir = new Vector3(0.5, 0.7, -0.3).normalize();
    const dirCopy = dir.clone();
    const palm = new Vector3(0, 0, 1).normalize();

    buildOrthogonalBasis(dir, palm);

    // dir should not be mutated
    expect(dir.x).toBeCloseTo(dirCopy.x);
    expect(dir.y).toBeCloseTo(dirCopy.y);
    expect(dir.z).toBeCloseTo(dirCopy.z);
  });

  it("produces a valid rotation quaternion (unit length)", () => {
    const dir = new Vector3(1, 1, 0).normalize();
    const palm = new Vector3(0, 0, 1).normalize();

    const { quat } = buildOrthogonalBasis(dir, palm);

    expect(quat.length()).toBeCloseTo(1);
  });
});

describe("JewelryModel — palm vs backhand detection", () => {
  it("detects palm facing when palmNormal.z > threshold", () => {
    expect(detectPalmFacing(0.5, false)).toBe(true);
    expect(detectPalmFacing(0.2, false)).toBe(true);
  });

  it("detects backhand when palmNormal.z < -threshold", () => {
    expect(detectPalmFacing(-0.5, true)).toBe(false);
    expect(detectPalmFacing(-0.2, true)).toBe(false);
  });

  it("maintains current state within hysteresis band", () => {
    // Already palm-facing, z is slightly negative but within threshold
    expect(detectPalmFacing(-0.1, true)).toBe(true);
    // Already backhand, z is slightly positive but below threshold
    expect(detectPalmFacing(0.1, false)).toBe(false);
  });

  it("respects custom threshold", () => {
    // With threshold 0.3, z=0.2 should NOT trigger palm-facing
    expect(detectPalmFacing(0.2, false, 0.3)).toBe(false);
    // But z=0.4 should
    expect(detectPalmFacing(0.4, false, 0.3)).toBe(true);
  });
});

describe("JewelryModel — visibility logic", () => {
  it("ring should be hidden when landmarks are null", () => {
    const landmarks = null;
    const visible = landmarks !== null && (landmarks as unknown[]).length > 17;
    expect(visible).toBe(false);
  });

  it("ring should be hidden when landmarks have insufficient points", () => {
    const landmarks = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0 }));
    const visible = landmarks !== null && landmarks.length > 17;
    expect(visible).toBe(false);
  });

  it("ring should be visible when landmarks have 21 points", () => {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    const visible = landmarks !== null && landmarks.length > 17;
    expect(visible).toBe(true);
  });
});

// ── Bracelet-specific tests ───────────────────────────────────

describe("JewelryModel — bracelet anchor config", () => {
  it("bracelet anchors to a single wrist landmark", () => {
    const config = getAnchorConfig("bracelet");
    expect(config.anchorLandmarks).toEqual([0]);
    expect(config.anchorLandmarks).toHaveLength(1);
  });

  it("ring anchors to two landmarks (MCP + PIP)", () => {
    const config = getAnchorConfig("ring");
    expect(config.anchorLandmarks).toEqual([13, 14]);
    expect(config.anchorLandmarks).toHaveLength(2);
  });

  it("bracelet has negative axial offset (toward forearm)", () => {
    expect(BRACELET_ANCHOR.axialOffset).toBeLessThan(0);
  });

  it("ring has zero axial offset", () => {
    expect(RING_ANCHOR.axialOffset).toBe(0);
  });

  it("both presets have depthReferenceLandmarks", () => {
    expect(RING_ANCHOR.depthReferenceLandmarks).toEqual([0, 5]);
    expect(BRACELET_ANCHOR.depthReferenceLandmarks).toEqual([0, 5]);
  });
});

describe("JewelryModel — scale clamping (bracelet defaults)", () => {
  it("clamps below bracelet minScale", () => {
    const s = computeScale(0, 0, {
      baseScale: BRACELET_ANCHOR.baseScale,
      fingerScaleFactor: BRACELET_ANCHOR.scaleFactor,
      palmScaleFactor: BRACELET_ANCHOR.palmScaleFactor,
      minScale: BRACELET_ANCHOR.minScale,
      maxScale: BRACELET_ANCHOR.maxScale,
    });
    expect(s).toBeGreaterThanOrEqual(BRACELET_ANCHOR.minScale);
    expect(s).toBeLessThanOrEqual(BRACELET_ANCHOR.maxScale);
  });

  it("clamps above bracelet maxScale", () => {
    const s = computeScale(10, 10, {
      baseScale: BRACELET_ANCHOR.baseScale,
      fingerScaleFactor: BRACELET_ANCHOR.scaleFactor,
      palmScaleFactor: BRACELET_ANCHOR.palmScaleFactor,
      minScale: BRACELET_ANCHOR.minScale,
      maxScale: BRACELET_ANCHOR.maxScale,
    });
    expect(s).toBe(BRACELET_ANCHOR.maxScale);
  });

  it("bracelet scale range is larger than ring scale range", () => {
    expect(BRACELET_ANCHOR.minScale).toBeGreaterThan(RING_ANCHOR.minScale);
    expect(BRACELET_ANCHOR.maxScale).toBeGreaterThan(RING_ANCHOR.maxScale);
  });
});

describe("JewelryModel — anchor position averaging", () => {
  function computeAnchorPosition(
    landmarks: { x: number; y: number; z: number }[],
    anchorIndices: number[],
  ) {
    let x = 0, y = 0, z = 0;
    for (const i of anchorIndices) {
      x += landmarks[i].x;
      y += landmarks[i].y;
      z += landmarks[i].z;
    }
    const n = anchorIndices.length;
    return { x: x / n, y: y / n, z: z / n };
  }

  it("ring anchor = midpoint of landmarks 13 and 14", () => {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    landmarks[13] = { x: 0.4, y: 0.3, z: 0.1 };
    landmarks[14] = { x: 0.6, y: 0.5, z: 0.2 };
    const pos = computeAnchorPosition(landmarks, RING_ANCHOR.anchorLandmarks);
    expect(pos.x).toBeCloseTo(0.5);
    expect(pos.y).toBeCloseTo(0.4);
    expect(pos.z).toBeCloseTo(0.15);
  });

  it("bracelet anchor = wrist landmark 0 directly", () => {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    landmarks[0] = { x: 0.5, y: 0.8, z: 0.05 };
    const pos = computeAnchorPosition(landmarks, BRACELET_ANCHOR.anchorLandmarks);
    expect(pos.x).toBeCloseTo(0.5);
    expect(pos.y).toBeCloseTo(0.8);
    expect(pos.z).toBeCloseTo(0.05);
  });

  it("single-landmark anchor returns that landmark's exact position", () => {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    landmarks[0] = { x: 0.1, y: 0.2, z: 0.3 };
    const pos = computeAnchorPosition(landmarks, [0]);
    expect(pos.x).toBeCloseTo(0.1);
    expect(pos.y).toBeCloseTo(0.2);
    expect(pos.z).toBeCloseTo(0.3);
  });
});
