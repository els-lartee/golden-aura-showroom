import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cartApi } from "@/lib/cart";

export const useCart = () =>
  useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.current,
  });

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.updateItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
};

export const useMergeCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.merge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
};
