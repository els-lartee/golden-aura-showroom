import { apiClient } from "@/lib/api";

export type CouponValidation = {
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
  applies_to_collection?: number | null;
  applies_to_product?: number | null;
  discount_type: "percent" | "fixed";
  value: string;
};

export const promotionsApi = {
  validateCoupon: (code: string) =>
    apiClient.post<CouponValidation>("/coupons/validate", { code }),
  activePromotions: () => apiClient.get<PromotionRule[]>("/promotions/active"),
};
