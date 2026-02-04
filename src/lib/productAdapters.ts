import type { ApiCollection, ApiProduct, ApiProductMedia } from "@/lib/types";

const sortMedia = (media: ApiProductMedia[]) =>
  [...media].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

export const getProductImages = (product: ApiProduct) => {
  const images = sortMedia(product.media || [])
    .filter((item) => item.media_type === "image")
    .map((item) => item.url);
  return images.length ? images : ["/placeholder.svg"];
};

export const getProductCategory = (
  product: ApiProduct,
  collections: ApiCollection[]
) => {
  const lookup = new Map(collections.map((collection) => [collection.id, collection.name]));
  const first = product.collections?.[0];
  return first ? lookup.get(first) ?? "Collection" : "Collection";
};
