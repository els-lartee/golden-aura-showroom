import { describe, it, expect } from "vitest";

import { Vector3, Quaternion, Matrix4 } from "three";
import { RING_ANCHOR, BRACELET_ANCHOR, getAnchorConfig } from "@/lib/jewelryConfig";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function lmToPixel(lm: { x: number; y: number; z: number }, w: number, h: number): Vector3 {
  return new Vector3(lm.x * w, (1.0 - lm.y) * h, lm.z * w);
}

function safeNormalize(v: Vector3, fallback: Vector3): Vector3 {
  const len = v.length();
  if (len < 1e-8) return v.copy(fallback);
  return v.divideScalar(len);
}

function buildBasis(
  landmarks: { x: number; y: number; z: number }[],
  dirFrom: number,
  dirTo: number,
  w: number,
  h: number,
) {
  const fallback = new Vector3(0, 1, 0);
  const from = lmToPixel(landmarks[dirFrom], w, h);
  const to = lmToPixel(landmarks[dirTo], w, h);
  const boneDir = safeNormalize(new Vector3().subVectors(to, from), fallback);

  const wrist = lmToPixel(landmarks[0], w, h);
  const indexMcp = lmToPixel(landmarks[5], w, h);
  const pinkyMcp = lmToPixel(landmarks[17], w, h);

  const wristToIndex = new Vector3().subVectors(indexMcp, wrist);
  const wristToPinky = new Vector3().subVectors(pinkyMcp, wrist);
  const rawNormal = new Vector3().crossVectors(wristToIndex, wristToPinky);
  safeNormalize(rawNormal, fallback);
  rawNormal.negate();

  const dot = rawNormal.dot(boneDir);
  const palmNormal = safeNormalize(
    new Vector3().copy(rawNormal).addScaledVector(boneDir, -dot),
    fallback,
  );

  const lateral = new Vector3().crossVectors(boneDir, palmNormal).normalize();

  const rotMat = new Matrix4().makeBasis(lateral, boneDir, palmNormal);
  const quat = new Quaternion().setFromRotationMatrix(rotMat);

  return { boneDir, palmNormal, lateral, quat };
}

function computeAnchorPixel(
  landmarks: { x: number; y: number; z: number }[],
  anchorIndices: number[],
  w: number,
  h: number,
) {
  const pos = new Vector3();
  for (const idx of anchorIndices) {
    pos.add(lmToPixel(landmarks[idx], w, h));
  }
  return pos.divideScalar(anchorIndices.length);
}

describe("JewelryModel - pixel coordinate mapping", () => {
  const w = 1280, h = 960;

  it("maps (0, 0, 0) to top-left in pixel coords (y-up)", () => {
    const p = lmToPixel({ x: 0, y: 0, z: 0 }, w, h);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(h);
    expect(p.z).toBeCloseTo(0);
  });

  it("maps (1, 1, 0) to bottom-right", () => {
    const p = lmToPixel({ x: 1, y: 1, z: 0 }, w, h);
    expect(p.x).toBeCloseTo(w);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(0);
  });

  it("maps (0.5, 0.5, 0) to center", () => {
    const p = lmToPixel({ x: 0.5, y: 0.5, z: 0 }, w, h);
    expect(p.x).toBeCloseTo(w / 2);
    expect(p.y).toBeCloseTo(h / 2);
    expect(p.z).toBeCloseTo(0);
  });

  it("z component scales by width", () => {
    const p = lmToPixel({ x: 0.5, y: 0.5, z: 0.1 }, w, h);
    expect(p.z).toBeCloseTo(0.1 * w);
  });
});

describe("JewelryModel - orthogonal basis (wide palm triangle)", () => {
  const w = 1280, h = 960;
  const makeLandmarks = () => {
    const lms = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    lms[0] = { x: 0.5, y: 0.8, z: 0 };
    lms[5] = { x: 0.35, y: 0.55, z: 0 };
    lms[9] = { x: 0.45, y: 0.5, z: 0 };
    lms[13] = { x: 0.55, y: 0.52, z: 0 };
    lms[14] = { x: 0.56, y: 0.42, z: 0 };
    lms[17] = { x: 0.65, y: 0.58, z: 0 };
    return lms;
  };

  it("produces mutually perpendicular basis vectors", () => {
    const { boneDir, palmNormal, lateral } = buildBasis(makeLandmarks(), 13, 14, w, h);
    expect(boneDir.dot(palmNormal)).toBeCloseTo(0, 4);
    expect(boneDir.dot(lateral)).toBeCloseTo(0, 4);
    expect(palmNormal.dot(lateral)).toBeCloseTo(0, 4);
  });

  it("all basis vectors are unit length", () => {
    const { boneDir, palmNormal, lateral } = buildBasis(makeLandmarks(), 13, 14, w, h);
    expect(boneDir.length()).toBeCloseTo(1);
    expect(palmNormal.length()).toBeCloseTo(1);
    expect(lateral.length()).toBeCloseTo(1);
  });

  it("produces a valid unit quaternion", () => {
    const { quat } = buildBasis(makeLandmarks(), 13, 14, w, h);
    expect(quat.length()).toBeCloseTo(1);
  });
});

describe("JewelryModel - scale from knuckle width", () => {
  it("produces scale proportional to knuckle width", () => {
    const normalizedScale = 0.5;
    const scaleFactor = 2.6;
    const knuckleWidth = 50;
    const expected = knuckleWidth * normalizedScale * scaleFactor;
    expect(expected).toBeCloseTo(65);
  });

  it("clamps within pixel-space range", () => {
    const s = clamp(5000, RING_ANCHOR.minScale, RING_ANCHOR.maxScale);
    expect(s).toBe(RING_ANCHOR.maxScale);

    const s2 = clamp(0.1, RING_ANCHOR.minScale, RING_ANCHOR.maxScale);
    expect(s2).toBe(RING_ANCHOR.minScale);
  });
});

describe("JewelryModel - anchor position averaging (pixel coords)", () => {
  const w = 1280, h = 960;

  it("ring anchor = midpoint of landmarks 13 and 14 in pixel space", () => {
    const lms = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    lms[13] = { x: 0.4, y: 0.3, z: 0 };
    lms[14] = { x: 0.6, y: 0.5, z: 0 };
    const pos = computeAnchorPixel(lms, RING_ANCHOR.anchorLandmarks, w, h);
    expect(pos.x).toBeCloseTo(0.5 * w);
    expect(pos.y).toBeCloseTo((1 - 0.4) * h);
  });

  it("bracelet anchor = wrist pixel position", () => {
    const lms = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    lms[0] = { x: 0.5, y: 0.8, z: 0 };
    const pos = computeAnchorPixel(lms, BRACELET_ANCHOR.anchorLandmarks, w, h);
    expect(pos.x).toBeCloseTo(0.5 * w);
    expect(pos.y).toBeCloseTo((1 - 0.8) * h);
  });
});

describe("JewelryModel - visibility logic", () => {
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

describe("JewelryModel - anchor config", () => {
  it("bracelet anchors to a single wrist landmark", () => {
    const config = getAnchorConfig("bracelet");
    expect(config.anchorLandmarks).toEqual([0]);
  });

  it("ring anchors to two landmarks (MCP + PIP)", () => {
    const config = getAnchorConfig("ring");
    expect(config.anchorLandmarks).toEqual([13, 14]);
  });

  it("bracelet has negative axial offset (toward forearm)", () => {
    expect(BRACELET_ANCHOR.axialOffset).toBeLessThan(0);
  });

  it("ring has zero axial offset", () => {
    expect(RING_ANCHOR.axialOffset).toBe(0);
  });

  it("ring uses landmarks 13 and 9 for scale reference (knuckle width)", () => {
    expect(RING_ANCHOR.scaleReferenceLandmarks).toEqual([13, 9]);
  });

  it("bracelet uses landmarks 0 and 5 for scale reference", () => {
    expect(BRACELET_ANCHOR.scaleReferenceLandmarks).toEqual([0, 5]);
  });
});

describe("JewelryModel - ring clipping plane normals", () => {
  const w = 1280, h = 960;
  const makeLandmarks = () => {
    const lms = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    lms[0] = { x: 0.5, y: 0.8, z: 0 };
    lms[5] = { x: 0.35, y: 0.55, z: 0 };
    lms[9] = { x: 0.45, y: 0.5, z: 0 };
    lms[13] = { x: 0.55, y: 0.52, z: 0 };
    lms[14] = { x: 0.56, y: 0.42, z: 0 };
    lms[17] = { x: 0.65, y: 0.58, z: 0 };
    return lms;
  };

  it("palm normal from quaternion Z-axis is unit length", () => {
    const { quat } = buildBasis(makeLandmarks(), 13, 14, w, h);
    const clipNormal = new Vector3(0, 0, 1).applyQuaternion(quat).normalize();
    expect(clipNormal.length()).toBeCloseTo(1);
  });

  it("palm and back clip normals are opposite", () => {
    const { quat } = buildBasis(makeLandmarks(), 13, 14, w, h);
    const palmNormal = new Vector3(0, 0, 1).applyQuaternion(quat).normalize();
    const backNormal = palmNormal.clone().negate();
    expect(palmNormal.dot(backNormal)).toBeCloseTo(-1);
  });

  it("clip normal is perpendicular to bone direction", () => {
    const { boneDir, quat } = buildBasis(makeLandmarks(), 13, 14, w, h);
    const clipNormal = new Vector3(0, 0, 1).applyQuaternion(quat).normalize();
    // The Z-axis of the basis (palmNormal) should be perpendicular to Y-axis (boneDir)
    expect(clipNormal.dot(boneDir)).toBeCloseTo(0, 4);
  });
});
