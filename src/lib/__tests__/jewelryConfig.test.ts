import { describe, it, expect } from "vitest";
import {
  BRACELET_ANCHOR,
  CATEGORY_JEWELRY_MAP,
  RING_ANCHOR,
  getAnchorConfig,
  getJewelryTypeFromSlug,
  getProductJewelryType,
} from "@/lib/jewelryConfig";
import type { ApiCategory, ApiProduct } from "@/lib/types";

// ── Slug → JewelryType mapping ───────────────────────────────

describe("getJewelryTypeFromSlug", () => {
  it('returns "ring" for slug "rings"', () => {
    expect(getJewelryTypeFromSlug("rings")).toBe("ring");
  });

  it('returns "bracelet" for slug "bracelets"', () => {
    expect(getJewelryTypeFromSlug("bracelets")).toBe("bracelet");
  });

  it("returns null for unknown slugs", () => {
    expect(getJewelryTypeFromSlug("earrings")).toBeNull();
    expect(getJewelryTypeFromSlug("necklaces")).toBeNull();
    expect(getJewelryTypeFromSlug("")).toBeNull();
  });
});

// ── Product → JewelryType resolution ─────────────────────────

describe("getProductJewelryType", () => {
  const categories: ApiCategory[] = [
    { id: 1, name: "Rings", slug: "rings" },
    { id: 2, name: "Bracelets", slug: "bracelets" },
    { id: 3, name: "Earrings", slug: "earrings" },
  ];

  const makeProduct = (categoryId: number | null): ApiProduct => ({
    id: 100,
    title: "Test",
    slug: "test",
    status: "active",
    base_price: "100",
    currency: "NGN",
    is_featured: false,
    category: categoryId,
    collections: [],
    media: [],
    variants: [],
  });

  it('returns "ring" for a product in the rings category', () => {
    expect(getProductJewelryType(makeProduct(1), categories)).toBe("ring");
  });

  it('returns "bracelet" for a product in the bracelets category', () => {
    expect(getProductJewelryType(makeProduct(2), categories)).toBe("bracelet");
  });

  it("returns null for a product in a non-AR category", () => {
    expect(getProductJewelryType(makeProduct(3), categories)).toBeNull();
  });

  it("returns null for a product with no category", () => {
    expect(getProductJewelryType(makeProduct(null), categories)).toBeNull();
  });

  it("returns null when category ID doesn't match any known category", () => {
    expect(getProductJewelryType(makeProduct(999), categories)).toBeNull();
  });
});

// ── Anchor configurations ────────────────────────────────────

describe("getAnchorConfig", () => {
  it("returns RING_ANCHOR for ring type", () => {
    expect(getAnchorConfig("ring")).toBe(RING_ANCHOR);
  });

  it("returns BRACELET_ANCHOR for bracelet type", () => {
    expect(getAnchorConfig("bracelet")).toBe(BRACELET_ANCHOR);
  });
});

describe("RING_ANCHOR", () => {
  it("anchors to landmarks 13 and 14", () => {
    expect(RING_ANCHOR.anchorLandmarks).toEqual([13, 14]);
  });

  it("uses landmarks 13→14 for direction", () => {
    expect(RING_ANCHOR.directionLandmarks).toEqual([13, 14]);
  });

  it("uses landmarks 13→14 for size span", () => {
    expect(RING_ANCHOR.sizeSpanLandmarks).toEqual([13, 14]);
  });

  it("has all landmark indices in valid range (0–20)", () => {
    const allIndices = [...RING_ANCHOR.anchorLandmarks, ...RING_ANCHOR.directionLandmarks, ...RING_ANCHOR.depthReferenceLandmarks];
    for (const idx of allIndices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(20);
    }
  });

  it("uses wrist and index MCP for depth reference", () => {
    expect(RING_ANCHOR.depthReferenceLandmarks).toEqual([0, 5]);
  });

  it("has zero axial offset for rings", () => {
    expect(RING_ANCHOR.axialOffset).toBe(0);
  });

  it("has a default diameter and size range", () => {
    expect(RING_ANCHOR.defaultDiameterMm).toBeGreaterThan(0);
    expect(RING_ANCHOR.sizeRangeMm.min).toBeLessThan(RING_ANCHOR.sizeRangeMm.max);
  });
});

describe("BRACELET_ANCHOR", () => {
  it("anchors to wrist landmark (0)", () => {
    expect(BRACELET_ANCHOR.anchorLandmarks).toEqual([0]);
  });

  it("uses landmarks 0→9 for direction (wrist → middle finger MCP)", () => {
    expect(BRACELET_ANCHOR.directionLandmarks).toEqual([0, 9]);
  });

  it("uses landmarks 0→5 for size span", () => {
    expect(BRACELET_ANCHOR.sizeSpanLandmarks).toEqual([0, 5]);
  });

  it("has all landmark indices in valid range (0–20)", () => {
    const allIndices = [...BRACELET_ANCHOR.anchorLandmarks, ...BRACELET_ANCHOR.directionLandmarks, ...BRACELET_ANCHOR.depthReferenceLandmarks];
    for (const idx of allIndices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(20);
    }
  });

  it("uses wrist and index MCP for depth reference", () => {
    expect(BRACELET_ANCHOR.depthReferenceLandmarks).toEqual([0, 5]);
  });

  it("has negative axial offset (pushes toward forearm)", () => {
    expect(BRACELET_ANCHOR.axialOffset).toBeLessThan(0);
  });

  it("has larger scale defaults than ring", () => {
    expect(BRACELET_ANCHOR.baseScale).toBeGreaterThan(RING_ANCHOR.baseScale);
    expect(BRACELET_ANCHOR.minScale).toBeGreaterThan(RING_ANCHOR.minScale);
    expect(BRACELET_ANCHOR.maxScale).toBeGreaterThan(RING_ANCHOR.maxScale);
  });

  it("has larger surface offset than ring (wrist is thicker)", () => {
    expect(BRACELET_ANCHOR.surfaceOffset).toBeGreaterThan(RING_ANCHOR.surfaceOffset);
  });

  it("has a default diameter and size range", () => {
    expect(BRACELET_ANCHOR.defaultDiameterMm).toBeGreaterThan(0);
    expect(BRACELET_ANCHOR.sizeRangeMm.min).toBeLessThan(BRACELET_ANCHOR.sizeRangeMm.max);
  });
});

// ── CATEGORY_JEWELRY_MAP integrity ───────────────────────────

describe("CATEGORY_JEWELRY_MAP", () => {
  it("contains entries for rings and bracelets", () => {
    expect(CATEGORY_JEWELRY_MAP).toHaveProperty("rings", "ring");
    expect(CATEGORY_JEWELRY_MAP).toHaveProperty("bracelets", "bracelet");
  });

  it("all values are valid JewelryType strings", () => {
    const validTypes = new Set(["ring", "bracelet"]);
    for (const value of Object.values(CATEGORY_JEWELRY_MAP)) {
      expect(validTypes.has(value)).toBe(true);
    }
  });
});
