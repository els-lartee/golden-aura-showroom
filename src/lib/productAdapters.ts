import type { ApiCategory, ApiCollection, ApiProduct, ApiProductMedia } from "@/lib/types";

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api\/?$/, "");

/**
 * Resolve a media URL that may be a relative backend path (e.g. /assets/...)
 * into an absolute URL so the browser can load it.
 */
const resolveMediaUrl = (url: string): string => {
  if (!url) return "/placeholder.svg";
  // Already absolute
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative backend path — prefix with backend origin
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

const sortMedia = (media: ApiProductMedia[]) =>
  [...media].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

export const getProductImages = (product: ApiProduct) => {
  const images = sortMedia(product.media || [])
    .filter((item) => item.media_type === "image")
    .map((item) => resolveMediaUrl(item.url));
  return images.length ? images : ["/placeholder.svg"];
};

export const getProductModelUrl = (product: ApiProduct): string | null => {
  const model = sortMedia(product.media || []).find((item) => item.media_type === "model");
  return model ? resolveMediaUrl(model.url) : null;
};

export const getProductCategory = (
  product: ApiProduct,
  categories: ApiCategory[],
  collections: ApiCollection[]
) => {
  if (product.category) {
    const categoryLookup = new Map(categories.map((category) => [category.id, category.name]));
    return categoryLookup.get(product.category) ?? "Category";
  }
  const collectionLookup = new Map(collections.map((collection) => [collection.id, collection.name]));
  const first = product.collections?.[0];
  return first ? collectionLookup.get(first) ?? "Collection" : "Collection";
};
