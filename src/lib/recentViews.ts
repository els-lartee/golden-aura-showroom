import { apiClient } from "@/lib/api";
import type { ApiProduct } from "@/lib/types";

export const recentViewsApi = {
  list: (limit = 8) => apiClient.get<ApiProduct[]>("/recent-views", { limit }),
  clear: () => apiClient.delete<{ deleted: number }>("/recent-views"),
};
