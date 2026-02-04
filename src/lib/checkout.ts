import { apiClient } from "@/lib/api";

export type CheckoutPayload = {
  cart_id: number;
  guest_email?: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address1: string;
  shipping_address2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  tax?: string;
  shipping?: string;
  currency?: string;
};

export type OrderResponse = {
  id: number;
  status: string;
  total: string;
  currency: string;
};

export type PaymentResponse = {
  id: number;
  reference: string;
  status: string;
  amount: string;
  currency: string;
};

export const checkoutApi = {
  checkout: (payload: CheckoutPayload) =>
    apiClient.post<OrderResponse>("/checkout", payload),
  initializePayment: (payload: { order: number; amount: string; currency?: string }) =>
    apiClient.post<PaymentResponse>("/payments/initialize", payload),
  verifyPayment: (payload: { reference: string }) =>
    apiClient.post<PaymentResponse>("/payments/verify", payload),
};
