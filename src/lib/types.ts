export type ApiCollection = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type ApiProductMedia = {
  id: number;
  product: number;
  url: string;
  file?: string | null;
  media_type: "image" | "video" | "model";
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
};

export type ApiProductVariant = {
  id: number;
  product: number;
  name: string;
  sku: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
};

export type ApiProduct = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  status: string;
  base_price: string;
  currency: string;
  is_featured: boolean;
  category?: number | null;
  collections: number[];
  tags?: number[];
  media: ApiProductMedia[];
  variants: ApiProductVariant[];
};

export type ApiTag = {
  id: number;
  name: string;
  slug: string;
};

export type ApiFavorite = {
  id: number;
  user: number;
  product: number;
  product_detail: ApiProduct;
  created_at: string;
};
