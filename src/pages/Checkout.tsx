import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useCheckout, usePaymentInit, usePaymentVerify } from "@/hooks/useCheckout";
import { useMe } from "@/hooks/useAuth";
import { promotionsApi, type CouponValidation } from "@/lib/promotions";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { data: cart } = useCart();
  const { data: me } = useMe();
  const checkout = useCheckout();
  const paymentInit = usePaymentInit();
  const paymentVerify = usePaymentVerify();
  const { toast } = useToast();
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [formState, setFormState] = useState({
    guest_email: "",
    shipping_name: "",
    shipping_phone: "",
    shipping_address1: "",
    shipping_address2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "GH",
  });

  const canCheckout = Boolean(cart?.items?.length);
  const orderTotal = useMemo(() => {
    return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [cart?.items]);

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart) return;

    const payload = {
      cart_id: cart.id,
      ...formState,
      guest_email: me?.user ? undefined : formState.guest_email,
      shipping: "0.00",
      tax: "0.00",
      currency: "NGN",
    };

    try {
      const order = await checkout.mutateAsync(payload);
      const payment = await paymentInit.mutateAsync({
        order: order.id,
        amount: order.total,
        currency: order.currency,
      });
      setPaymentReference(payment.reference);
      setPaymentStatus(payment.status);
    } catch (error) {
      const message = (error as { message?: string })?.message || "Checkout failed";
      toast({
        title: "Checkout failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCouponApply = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const coupon = await promotionsApi.validateCoupon(couponCode.trim());
      setAppliedCoupon(coupon);
      toast({ title: "Coupon applied", description: `${coupon.code} is valid.` });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Invalid coupon";
      setAppliedCoupon(null);
      toast({
        title: "Coupon invalid",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <p className="swiss-subheading text-primary mb-2">Checkout</p>
            <h1 className="swiss-heading text-foreground">Complete your order</h1>
          </div>

          {!canCheckout ? (
            <div className="bg-secondary border border-border rounded-sm p-10 text-center">
              <p className="text-muted-foreground mb-6">Your bag is empty.</p>
              <Link to="/catalog">
                <Button className="bg-gradient-gold text-primary-foreground">
                  Browse collections
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {!me?.user && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      required
                      value={formState.guest_email}
                      onChange={(event) => handleChange("guest_email", event.target.value)}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Full Name
                    </label>
                    <Input
                      required
                      value={formState.shipping_name}
                      onChange={(event) => handleChange("shipping_name", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Phone
                    </label>
                    <Input
                      required
                      value={formState.shipping_phone}
                      onChange={(event) => handleChange("shipping_phone", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                    Address Line 1
                  </label>
                  <Input
                    required
                    value={formState.shipping_address1}
                    onChange={(event) => handleChange("shipping_address1", event.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                    Address Line 2
                  </label>
                  <Input
                    value={formState.shipping_address2}
                    onChange={(event) => handleChange("shipping_address2", event.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      City
                    </label>
                    <Input
                      required
                      value={formState.shipping_city}
                      onChange={(event) => handleChange("shipping_city", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      State
                    </label>
                    <Input
                      required
                      value={formState.shipping_state}
                      onChange={(event) => handleChange("shipping_state", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Postal Code
                    </label>
                    <Input
                      required
                      value={formState.shipping_postal_code}
                      onChange={(event) => handleChange("shipping_postal_code", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                    Country
                  </label>
                  <Input
                    required
                    value={formState.shipping_country}
                    onChange={(event) => handleChange("shipping_country", event.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={checkout.isPending || paymentInit.isPending}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Place order
                </Button>

                {paymentReference && (
                  <div className="mt-4 space-y-3 rounded-sm border border-border bg-secondary p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Payment reference
                    </p>
                    <p className="text-sm font-semibold">{paymentReference}</p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={paymentVerify.isPending}
                      onClick={async () => {
                        if (!paymentReference) return;
                        const verified = await paymentVerify.mutateAsync({
                          reference: paymentReference,
                        });
                        setPaymentStatus(verified.status);
                      }}
                    >
                      Verify payment
                    </Button>
                    {paymentStatus && (
                      <p className="text-xs text-muted-foreground">
                        Status: {paymentStatus}
                      </p>
                    )}
                  </div>
                )}
              </form>

              <aside className="bg-secondary border border-border rounded-sm p-6 h-fit">
                <h2 className="font-serif text-xl mb-4">Order Summary</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Items: {cart?.items?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Total Quantity: {orderTotal}
                </p>
                <div className="mb-6 space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide">
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="WELCOME10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCouponApply}
                      disabled={isValidatingCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-muted-foreground">
                      Applied {appliedCoupon.code} — {appliedCoupon.discount_type === "percent"
                        ? `${appliedCoupon.value}%`
                        : `₦${appliedCoupon.value}`}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pricing details will update once Paystack is integrated.
                </p>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
