import { apiClient } from "@/lib/api";
import type { ApiFavorite } from "@/lib/types";

type ToggleFavoriteResponse = {
  status: "added" | "removed";
  product: number;
  id?: number;
};

export const favoritesApi = {
  list: () => apiClient.get<ApiFavorite[]>("/favorites/"),
  add: (productId: number) => apiClient.post<ApiFavorite>("/favorites/", { product: productId }),
  remove: (favoriteId: number) => apiClient.delete<void>(`/favorites/${favoriteId}/`),
  toggle: (productId: number) =>
    apiClient.post<ToggleFavoriteResponse>("/favorites/toggle/", { product: productId }),
};

export type { ToggleFavoriteResponse };
