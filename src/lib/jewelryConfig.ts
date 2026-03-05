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
  /** Landmark pair [a, b] whose pixel distance drives the scale (knuckle width). */
  scaleReferenceLandmarks: [number, number];
  /** Multiplier applied to `knuckleWidth * normalizedModelScale`. */
  scaleFactor: number;
  /** Minimum allowed pixel-space scale. */
  minScale: number;
  /** Maximum allowed pixel-space scale. */
  maxScale: number;
  /** Offset along the negative direction axis (e.g. toward forearm for bracelets). */
  axialOffset: number;
}

/** Ring preset: anchor between ring-finger MCP (13) and PIP (14). */
export const RING_ANCHOR: JewelryAnchorConfig = {
  anchorLandmarks: [13, 14],
  directionLandmarks: [13, 14],
  scaleReferenceLandmarks: [13, 9],
  scaleFactor: 2.6,
  minScale: 1,
  maxScale: 500,
  axialOffset: 0,
};

/** Bracelet preset: anchor at wrist (0), direction toward middle-finger MCP (9). */
export const BRACELET_ANCHOR: JewelryAnchorConfig = {
  anchorLandmarks: [0],
  directionLandmarks: [0, 9],
  scaleReferenceLandmarks: [0, 5],
  scaleFactor: 3.0,
  minScale: 1,
  maxScale: 800,
  axialOffset: -20,
};

const ANCHOR_MAP: Record<JewelryType, JewelryAnchorConfig> = {
  ring: RING_ANCHOR,
  bracelet: BRACELET_ANCHOR,
};

/** Get the anchor configuration for a given jewelry type. */
export const getAnchorConfig = (type: JewelryType): JewelryAnchorConfig =>
  ANCHOR_MAP[type];
