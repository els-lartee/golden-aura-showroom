import { apiClient } from "@/lib/api";
import type { ApiCategory, ApiProduct, ApiTag } from "@/lib/types";

export type AdminMetrics = {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  low_inventory_variants: number;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
};

export type Coupon = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: string;
  active: boolean;
  max_uses: number;
  used_count: number;
  start_at?: string | null;
  end_at?: string | null;
};

export type PromotionRule = {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  min_cart_value: string;
  discount_type: "percent" | "fixed";
  value: string;
  applies_to_collection?: number | null;
  applies_to_product?: number | null;
};

export type Order = {
  id: number;
  guest_email?: string;
  status: string;
  currency: string;
  total: string;
  created_at: string;
};

export const adminApi = {
  metrics: () => apiClient.get<AdminMetrics>("/admin/metrics"),
  lowInventory: () => apiClient.get<any[]>("/admin/inventory/low"),
  users: () => apiClient.get<AdminUser[]>("/admin/users/"),
  updateUser: (id: number, payload: Partial<AdminUser>) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/`, payload),
  products: () => apiClient.get<ApiProduct[]>("/products/"),
  createProduct: (payload: Partial<ApiProduct>) =>
    apiClient.post<ApiProduct>("/products/", payload),
  updateProduct: (id: number, payload: Partial<ApiProduct>) =>
    apiClient.patch<ApiProduct>(`/products/${id}/`, payload),
  tags: () => apiClient.get<ApiTag[]>("/tags/"),
  createTag: (payload: Partial<ApiTag>) => apiClient.post<ApiTag>("/tags/", payload),
  deleteTag: (id: number) => apiClient.delete<void>(`/tags/${id}/`),
  categories: () => apiClient.get<ApiCategory[]>("/categories/"),
  createCategory: (payload: Partial<ApiCategory>) => apiClient.post<ApiCategory>("/categories/", payload),
  deleteCategory: (id: number) => apiClient.delete<void>(`/categories/${id}/`),
  createProductMedia: (payload: FormData) => apiClient.upload("/product-media/", payload),
  coupons: () => apiClient.get<Coupon[]>("/coupons/"),
  createCoupon: (payload: Partial<Coupon>) => apiClient.post<Coupon>("/coupons/", payload),
  promotionRules: () => apiClient.get<PromotionRule[]>("/promotion-rules/"),
  createPromotionRule: (payload: Partial<PromotionRule>) =>
    apiClient.post<PromotionRule>("/promotion-rules/", payload),
  orders: () => apiClient.get<Order[]>("/orders/"),
  updateOrder: (id: number, payload: Partial<Order>) =>
    apiClient.patch<Order>(`/orders/${id}/`, payload),
  refundOrder: (id: number) => apiClient.post<Order>(`/orders/${id}/refund/`),
};
