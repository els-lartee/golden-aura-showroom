/**
 * One Euro Filter — adaptive low-pass filter for noisy signals.
 *
 * Reference: Géry Casiez, Nicolas Roussel, Daniel Vogel.
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems."
 * CHI 2012.  http://cristal.univ-lille.fr/~casiez/1euro/
 *
 * The key idea: use a low cutoff (= heavy smoothing) when the signal is slow
 * and a high cutoff (= responsive) when the signal is fast. `beta` controls
 * how aggressively the cutoff rises with speed.
 */

/** Compute the smoothing factor alpha from a cutoff frequency and delta time. */
const smoothingFactor = (te: number, cutoff: number): number => {
  const r = 2 * Math.PI * cutoff * te;
  return r / (r + 1);
};

/** Simple exponential smoothing: out = a * x + (1 - a) * prev. */
const exponentialSmoothing = (a: number, x: number, prev: number): number =>
  a * x + (1 - a) * prev;

/**
 * A single-axis One Euro Filter.
 *
 * Usage:
 * ```ts
 * const f = new OneEuroFilter({ minCutoff: 1.0, beta: 0.007 });
 * const smoothed = f.filter(rawValue, timestamp);
 * ```
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private prevRaw: number | null = null;
  private prevFiltered: number | null = null;
  private prevDx: number | null = null;
  private prevTimestamp: number | null = null;

  constructor(opts: { minCutoff?: number; beta?: number; dCutoff?: number } = {}) {
    this.minCutoff = opts.minCutoff ?? 1.0;
    this.beta = opts.beta ?? 0.007;
    this.dCutoff = opts.dCutoff ?? 1.0;
  }

  /** Reset internal state so the next call is treated as the first sample. */
  reset(): void {
    this.prevRaw = null;
    this.prevFiltered = null;
    this.prevDx = null;
    this.prevTimestamp = null;
  }

  /**
   * Feed a new sample and return the filtered value.
   *
   * @param value  Raw noisy value.
   * @param timestamp  Monotonic time in **seconds** (e.g. performance.now()/1000).
   */
  filter(value: number, timestamp: number): number {
    if (this.prevTimestamp === null || this.prevFiltered === null) {
      // First sample — no history, just pass through.
      this.prevRaw = value;
      this.prevFiltered = value;
      this.prevDx = 0;
      this.prevTimestamp = timestamp;
      return value;
    }

    const te = timestamp - this.prevTimestamp;
    if (te <= 0) {
      // Clock didn't advance — return previous filtered value.
      return this.prevFiltered;
    }

    // Estimate derivative (speed) of the signal.
    const dx = (value - (this.prevRaw ?? value)) / te;
    const edx = exponentialSmoothing(smoothingFactor(te, this.dCutoff), dx, this.prevDx ?? 0);

    // Adaptive cutoff based on speed.
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const alpha = smoothingFactor(te, cutoff);

    const filtered = exponentialSmoothing(alpha, value, this.prevFiltered);

    this.prevRaw = value;
    this.prevFiltered = filtered;
    this.prevDx = edx;
    this.prevTimestamp = timestamp;

    return filtered;
  }
}

/**
 * A 3-axis One Euro Filter (e.g. for position x/y/z).
 * Each axis is filtered independently.
 */
export class OneEuroFilter3 {
  private filters: [OneEuroFilter, OneEuroFilter, OneEuroFilter];

  constructor(opts: { minCutoff?: number; beta?: number; dCutoff?: number } = {}) {
    this.filters = [
      new OneEuroFilter(opts),
      new OneEuroFilter(opts),
      new OneEuroFilter(opts),
    ];
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
  }

  /**
   * Filter a 3D value.
   *
   * @param x Raw x.
   * @param y Raw y.
   * @param z Raw z.
   * @param timestamp Monotonic time in seconds.
   * @returns Tuple `[filteredX, filteredY, filteredZ]`.
   */
  filter(x: number, y: number, z: number, timestamp: number): [number, number, number] {
    return [
      this.filters[0].filter(x, timestamp),
      this.filters[1].filter(y, timestamp),
      this.filters[2].filter(z, timestamp),
    ];
  }
}

/**
 * A 4-component One Euro Filter suitable for quaternion smoothing.
 *
 * NOTE: because quaternion double-cover (q and -q represent the same rotation),
 * you should ensure the input quaternion is in the same hemisphere as the
 * previous sample before feeding it to this filter (flip sign of all components
 * if dot product with previous raw is negative).
 */
export class OneEuroFilter4 {
  private filters: [OneEuroFilter, OneEuroFilter, OneEuroFilter, OneEuroFilter];
  private prevRaw: [number, number, number, number] | null = null;

  constructor(opts: { minCutoff?: number; beta?: number; dCutoff?: number } = {}) {
    this.filters = [
      new OneEuroFilter(opts),
      new OneEuroFilter(opts),
      new OneEuroFilter(opts),
      new OneEuroFilter(opts),
    ];
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
    this.prevRaw = null;
  }

  /**
   * Filter a quaternion (x, y, z, w).
   *
   * Automatically handles hemisphere flipping to avoid quaternion discontinuities.
   *
   * @returns Tuple `[x, y, z, w]` (not necessarily unit-length; normalize after).
   */
  filter(
    x: number,
    y: number,
    z: number,
    w: number,
    timestamp: number,
  ): [number, number, number, number] {
    // Ensure shortest-path by flipping into the same hemisphere as previous sample.
    if (this.prevRaw) {
      const dot =
        x * this.prevRaw[0] +
        y * this.prevRaw[1] +
        z * this.prevRaw[2] +
        w * this.prevRaw[3];
      if (dot < 0) {
        x = -x;
        y = -y;
        z = -z;
        w = -w;
      }
    }
    this.prevRaw = [x, y, z, w];

    return [
      this.filters[0].filter(x, timestamp),
      this.filters[1].filter(y, timestamp),
      this.filters[2].filter(z, timestamp),
      this.filters[3].filter(w, timestamp),
    ];
  }
}
