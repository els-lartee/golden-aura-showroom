import { apiClient } from "@/lib/api";

export type CartItem = {
  id: number;
  cart: number;
  product_variant: number;
  quantity: number;
  added_at: string;
};

export type Cart = {
  id: number;
  user: number | null;
  session_key: string;
  status: "open" | "abandoned" | "converted";
  items: CartItem[];
};

export const cartApi = {
  current: () => apiClient.get<Cart>("/cart/current"),
  merge: () => apiClient.post<Cart>("/cart/merge"),
  abandon: () => apiClient.post<{ abandoned: number }>("/cart/abandon"),
  addItem: (payload: { cart: number; product_variant: number; quantity: number }) =>
    apiClient.post<CartItem>("/cart-items/", payload),
  updateItem: (id: number, payload: { quantity: number }) =>
    apiClient.patch<CartItem>(`/cart-items/${id}/`, payload),
  removeItem: (id: number) => apiClient.delete<void>(`/cart-items/${id}/`),
};
