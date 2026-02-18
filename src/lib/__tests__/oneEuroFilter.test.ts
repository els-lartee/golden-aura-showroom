import { describe, it, expect } from "vitest";
import { OneEuroFilter, OneEuroFilter3, OneEuroFilter4 } from "@/lib/oneEuroFilter";

describe("OneEuroFilter", () => {
  it("returns the input value on the first sample", () => {
    const f = new OneEuroFilter();
    expect(f.filter(42, 0)).toBe(42);
  });

  it("converges to a constant value", () => {
    const f = new OneEuroFilter({ minCutoff: 1.0, beta: 0 });
    const target = 5.0;
    let val = 0;

    // Feed the target value many times
    for (let i = 0; i < 200; i++) {
      val = f.filter(target, i * 0.016); // ~60fps
    }

    expect(val).toBeCloseTo(target, 2);
  });

  it("suppresses jitter on a noisy signal", () => {
    const f = new OneEuroFilter({ minCutoff: 0.5, beta: 0 });
    const baseValue = 10;
    const noise = () => (Math.random() - 0.5) * 2; // ±1

    const rawValues: number[] = [];
    const filteredValues: number[] = [];

    for (let i = 0; i < 300; i++) {
      const raw = baseValue + noise();
      rawValues.push(raw);
      filteredValues.push(f.filter(raw, i * 0.016));
    }

    // Variance of filtered should be lower than raw
    const variance = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
    };

    // Skip the first 20 samples (settling period)
    const rawVar = variance(rawValues.slice(20));
    const filteredVar = variance(filteredValues.slice(20));

    expect(filteredVar).toBeLessThan(rawVar);
  });

  it("tracks a fast-moving signal with minimal lag when beta is high", () => {
    const f = new OneEuroFilter({ minCutoff: 1.0, beta: 10 });

    // Start at 0, then jump to 100
    f.filter(0, 0);
    f.filter(0, 0.016);
    f.filter(0, 0.032);

    // Jump to 100
    const after1 = f.filter(100, 0.048);
    const after2 = f.filter(100, 0.064);
    const after3 = f.filter(100, 0.080);

    // With high beta, should be close to 100 within a few frames
    expect(after3).toBeGreaterThan(80);
  });

  it("handles negative values and zero crossings", () => {
    const f = new OneEuroFilter({ minCutoff: 1.0, beta: 0.5 });

    f.filter(-10, 0);
    f.filter(-5, 0.016);
    const val = f.filter(5, 0.032);

    // Should transition smoothly through zero
    expect(typeof val).toBe("number");
    expect(Number.isFinite(val)).toBe(true);
  });

  it("returns previous value when clock does not advance", () => {
    const f = new OneEuroFilter();
    f.filter(10, 1.0);
    const v1 = f.filter(20, 1.0); // same timestamp
    expect(v1).toBe(10); // should return previous since dt=0
  });

  it("can be reset and behaves like new", () => {
    const f = new OneEuroFilter();
    f.filter(100, 0);
    f.filter(100, 0.016);
    f.reset();

    // After reset, first call should pass through
    expect(f.filter(42, 0.032)).toBe(42);
  });
});

describe("OneEuroFilter3", () => {
  it("filters each axis independently", () => {
    const f = new OneEuroFilter3({ minCutoff: 1.0, beta: 0 });

    // First sample should pass through
    const [x0, y0, z0] = f.filter(1, 2, 3, 0);
    expect(x0).toBe(1);
    expect(y0).toBe(2);
    expect(z0).toBe(3);

    // Subsequent samples are filtered
    const [x1, y1, z1] = f.filter(1, 2, 3, 0.016);
    expect(Number.isFinite(x1)).toBe(true);
    expect(Number.isFinite(y1)).toBe(true);
    expect(Number.isFinite(z1)).toBe(true);
  });

  it("converges each axis to constant targets", () => {
    const f = new OneEuroFilter3({ minCutoff: 1.0, beta: 0 });
    let result: [number, number, number] = [0, 0, 0];

    for (let i = 0; i < 200; i++) {
      result = f.filter(5, -3, 7, i * 0.016);
    }

    expect(result[0]).toBeCloseTo(5, 1);
    expect(result[1]).toBeCloseTo(-3, 1);
    expect(result[2]).toBeCloseTo(7, 1);
  });
});

describe("OneEuroFilter4", () => {
  it("handles quaternion hemisphere flipping", () => {
    const f = new OneEuroFilter4({ minCutoff: 1.0, beta: 0.5 });

    // Feed a quaternion
    f.filter(0, 0, 0, 1, 0);

    // Feed the negated equivalent quaternion (-q represents same rotation)
    const [x, y, z, w] = f.filter(0, 0, 0, -1, 0.016);

    // Should flip to same hemisphere as previous → result should be near (0,0,0,1)
    // not jumping to (0,0,0,-1)
    expect(w).toBeGreaterThan(0);
  });

  it("first sample passes through", () => {
    const f = new OneEuroFilter4();
    const [x, y, z, w] = f.filter(0, 0.707, 0, 0.707, 0);
    expect(x).toBe(0);
    expect(y).toBeCloseTo(0.707);
    expect(z).toBe(0);
    expect(w).toBeCloseTo(0.707);
  });
});
