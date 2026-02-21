import type { ApiCategory, ApiProduct } from "@/lib/types";

// ── Jewelry Types ─────────────────────────────────────────────

/** AR-supported jewelry types. */
export type JewelryType = "ring" | "bracelet";

/**
 * Maps category slugs to AR jewelry types.
 * Add entries here when new AR-supported categories are created.
 */
export const CATEGORY_JEWELRY_MAP: Record<string, JewelryType> = {
  rings: "ring",
  bracelets: "bracelet",
};

/** Resolve a category slug to a JewelryType (or null if not AR-supported). */
export const getJewelryTypeFromSlug = (slug: string): JewelryType | null =>
  CATEGORY_JEWELRY_MAP[slug] ?? null;

/**
 * Determine the jewelry type for a product by looking up its category slug.
 * Returns null if the product has no category or the category isn't AR-supported.
 */
export const getProductJewelryType = (
  product: ApiProduct,
  categories: ApiCategory[],
): JewelryType | null => {
  if (!product.category) return null;
  const cat = categories.find((c) => c.id === product.category);
  if (!cat) return null;
  return getJewelryTypeFromSlug(cat.slug);
};

// ── Anchor Configuration ──────────────────────────────────────

/** Defines how a jewelry type anchors to the hand. */
export interface JewelryAnchorConfig {
  /** MediaPipe landmark indices to average for the anchor position. */
  anchorLandmarks: number[];
  /** Landmark pair [from, to] defining the orientation / direction axis. */
  directionLandmarks: [number, number];
  /** Landmark pair [from, to] defining the segment used for size calibration. */
  sizeSpanLandmarks: [number, number];
  /** Landmark pair [a, b] used for depth estimation (physical vs projected size). */
  depthReferenceLandmarks: [number, number];
  /** Default inner diameter in millimeters for the model. */
  defaultDiameterMm: number;
  /** Allowed size range in millimeters for user input. */
  sizeRangeMm: { min: number; max: number };
  /** Base scale added before landmark-based scaling. */
  baseScale: number;
  /** Multiplier for the primary segment length (finger or wrist-to-palm). */
  scaleFactor: number;
  /** Multiplier for the palm span contribution. */
  palmScaleFactor: number;
  /** Minimum allowed scale. */
  minScale: number;
  /** Maximum allowed scale. */
  maxScale: number;
  /** Outward offset from bone centerline to sit on the skin surface. */
  surfaceOffset: number;
  /** Offset along the (negative) direction axis — push toward forearm for bracelets. */
  axialOffset: number;
}

/** Ring preset: anchor between ring-finger MCP (13) and PIP (14). */
export const RING_ANCHOR: JewelryAnchorConfig = {
  anchorLandmarks: [13, 14],
  directionLandmarks: [13, 14],
  sizeSpanLandmarks: [13, 14],
  depthReferenceLandmarks: [0, 5],
  defaultDiameterMm: 18,
  sizeRangeMm: { min: 14, max: 24 },
  baseScale: 0.1,
  scaleFactor: 2.6,
  palmScaleFactor: 2,
  minScale: 0.07,
  maxScale: 0.28,
  surfaceOffset: 0.004,
  axialOffset: 0,
};

/** Bracelet preset: anchor at wrist (0), direction toward middle-finger MCP (9). */
export const BRACELET_ANCHOR: JewelryAnchorConfig = {
  anchorLandmarks: [0],
  directionLandmarks: [0, 9],
  sizeSpanLandmarks: [0, 5],
  depthReferenceLandmarks: [0, 5],
  defaultDiameterMm: 60,
  sizeRangeMm: { min: 50, max: 80 },
  baseScale: 0.25,
  scaleFactor: 3.0,
  palmScaleFactor: 1.5,
  minScale: 0.15,
  maxScale: 0.5,
  surfaceOffset: 0.008,
  axialOffset: -0.02,
};

const ANCHOR_MAP: Record<JewelryType, JewelryAnchorConfig> = {
  ring: RING_ANCHOR,
  bracelet: BRACELET_ANCHOR,
};

/** Get the anchor configuration for a given jewelry type. */
export const getAnchorConfig = (type: JewelryType): JewelryAnchorConfig =>
  ANCHOR_MAP[type];
