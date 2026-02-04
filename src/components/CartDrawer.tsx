import { ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { Link } from "react-router-dom";

const CartDrawer = () => {
  const { data: cart } = useCart();
  const removeItem = useRemoveCartItem();
  const updateItem = useUpdateCartItem();

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:text-primary transition-colors duration-300"
        >
          <ShoppingBag size={18} strokeWidth={1.5} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center">
            {totalItems}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px]">
        <SheetHeader className="space-y-4">
          <SheetTitle className="font-serif text-2xl">Your Bag</SheetTitle>
          <Separator />
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {cart?.items?.length ? (
            cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Variant #{item.product_variant}</p>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        updateItem.mutate({
                          id: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                    >
                      -
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        updateItem.mutate({
                          id: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem.mutate(item.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Your bag is empty.</div>
          )}
        </div>

        {cart?.items?.length ? (
          <div className="mt-8">
            <Link to="/checkout">
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
