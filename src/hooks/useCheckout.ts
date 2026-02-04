import { useMutation } from "@tanstack/react-query";

import { checkoutApi } from "@/lib/checkout";

export const useCheckout = () =>
  useMutation({
    mutationFn: checkoutApi.checkout,
  });

export const usePaymentInit = () =>
  useMutation({
    mutationFn: checkoutApi.initializePayment,
  });

export const usePaymentVerify = () =>
  useMutation({
    mutationFn: checkoutApi.verifyPayment,
  });
