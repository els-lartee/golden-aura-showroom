import { describe, it, expect } from "vitest";
import { getPalmOrientation, getPalmNormalWorld } from "@/lib/palmOrientation";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Helper to build a minimal 21-landmark array with custom positions for key landmarks. */
function makeLandmarks(
    overrides: Partial<Record<number, { x: number; y: number; z: number }>>,
): NormalizedLandmark[] {
    const base = Array.from({ length: 21 }, () => ({
        x: 0.5,
        y: 0.5,
        z: 0,
        visibility: 1,
    })) as NormalizedLandmark[];
    for (const [idx, vals] of Object.entries(overrides)) {
        Object.assign(base[Number(idx)], vals);
    }
    return base;
}

describe("getPalmOrientation", () => {
    // Landmarks arranged so that cross-product Z > 0 (left hand palm)
    const palmUpLandmarks = makeLandmarks({
        0: { x: 0.5, y: 0.8, z: 0 },  // wrist (bottom)
        5: { x: 0.35, y: 0.55, z: 0 }, // index MCP (upper-left)
        17: { x: 0.65, y: 0.58, z: 0 }, // pinky MCP (upper-right)
    });

    it("returns 'Palm' for Left hand with palm-facing landmarks", () => {
        expect(getPalmOrientation(palmUpLandmarks, "Left")).toBe("Palm");
    });

    it("returns 'Back' for Right hand with same landmarks (mirrored interpretation)", () => {
        expect(getPalmOrientation(palmUpLandmarks, "Right")).toBe("Back");
    });

    // Flip landmarks so cross-product Z < 0
    const backUpLandmarks = makeLandmarks({
        0: { x: 0.5, y: 0.8, z: 0 },
        5: { x: 0.65, y: 0.55, z: 0 },  // index MCP (upper-right)
        17: { x: 0.35, y: 0.58, z: 0 },  // pinky MCP (upper-left)
    });

    it("returns 'Back' for Left hand with back-facing landmarks", () => {
        expect(getPalmOrientation(backUpLandmarks, "Left")).toBe("Back");
    });

    it("returns 'Palm' for Right hand with back-facing landmarks", () => {
        expect(getPalmOrientation(backUpLandmarks, "Right")).toBe("Palm");
    });

    it("returns a valid result when landmarks are nearly coplanar", () => {
        const coplanar = makeLandmarks({
            0: { x: 0.5, y: 0.5, z: 0 },
            5: { x: 0.5, y: 0.5, z: 0 },
            17: { x: 0.5, y: 0.5, z: 0 },
        });
        // Should not throw; result is implementation-defined for degenerate input
        const result = getPalmOrientation(coplanar, "Left");
        expect(["Palm", "Back"]).toContain(result);
    });
});

describe("getPalmNormalWorld", () => {
    const w = 1280;
    const h = 960;

    it("returns a unit-length vector", () => {
        const lms = makeLandmarks({
            0: { x: 0.5, y: 0.8, z: 0 },
            5: { x: 0.35, y: 0.55, z: 0 },
            17: { x: 0.65, y: 0.58, z: 0 },
        });
        const normal = getPalmNormalWorld(lms, w, h);
        expect(normal.length()).toBeCloseTo(1, 4);
    });

    it("returns fallback for degenerate (coplanar) landmarks", () => {
        const lms = makeLandmarks({
            0: { x: 0.5, y: 0.5, z: 0 },
            5: { x: 0.5, y: 0.5, z: 0 },
            17: { x: 0.5, y: 0.5, z: 0 },
        });
        const normal = getPalmNormalWorld(lms, w, h);
        // Should return (0,0,1) fallback
        expect(normal.x).toBeCloseTo(0);
        expect(normal.y).toBeCloseTo(0);
        expect(normal.z).toBeCloseTo(1);
    });

    it("produces a non-zero Z component for typical hand landmarks", () => {
        const lms = makeLandmarks({
            0: { x: 0.5, y: 0.8, z: 0 },
            5: { x: 0.35, y: 0.55, z: 0 },
            17: { x: 0.65, y: 0.58, z: 0 },
        });
        const normal = getPalmNormalWorld(lms, w, h);
        // For landmarks in the xy plane, normal should be predominantly along z
        expect(Math.abs(normal.z)).toBeGreaterThan(0.5);
    });
});
