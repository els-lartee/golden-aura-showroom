import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoritesApi } from "@/lib/favorites";
import type { ApiFavorite } from "@/lib/types";

export const useFavorites = (enabled = true) =>
  useQuery<ApiFavorite[]>({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
    enabled,
  });

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
};
