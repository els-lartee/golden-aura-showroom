import { m } from "framer-motion";
import { Camera, Heart, ShoppingBag, Shield, RotateCcw, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiProduct, ApiProductVariant } from "@/lib/types";

type ProductInfoPanelProps = {
  product: ApiProduct;
  category: string;
  tagNames: string[];
  selectedVariantId: string;
  onVariantChange: (value: string) => void;
  selectedVariant: ApiProductVariant | null;
  canAddToCart: boolean;
  isAdding: boolean;
  isFavorite: boolean;
  onAddToCart: () => void;
  onFavoriteToggle: () => void;
  onARTryOn: () => void;
  hasModel: boolean;
};

const ProductInfoPanel = ({
  product,
  category,
  tagNames,
  selectedVariantId,
  onVariantChange,
  selectedVariant,
  canAddToCart,
  isAdding,
  isFavorite,
  onAddToCart,
  onFavoriteToggle,
  onARTryOn,
  hasModel,
}: ProductInfoPanelProps) => (
  <m.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="lg:py-4"
  >
    {product.is_featured && (
      <span className="inline-block px-3 py-1 bg-foreground text-background text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
        New Arrival
      </span>
    )}

    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.15em] mb-2">
      {category}
    </p>
    {tagNames.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {tagNames.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-secondary text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            {tag}
          </span>
        ))}
      </div>
    )}

    <h1 className="swiss-heading text-foreground mb-4">{product.title}</h1>

    <p className="text-2xl font-bold text-foreground mb-6 tracking-tight">
      GH₵ {Number(selectedVariant?.price ?? product.base_price).toLocaleString()}
    </p>

    {product.variants?.length > 1 && (
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Choose variant
        </p>
        <Select value={selectedVariantId} onValueChange={onVariantChange}>
          <SelectTrigger className="h-12 border-2 border-foreground bg-secondary text-sm font-semibold">
            <SelectValue placeholder="Select a variant" />
          </SelectTrigger>
          <SelectContent>
            {(product.variants || [])
              .filter((variant) => variant.is_active)
              .map((variant) => (
                <SelectItem key={variant.id} value={String(variant.id)}>
                  {variant.name} · GH₵ {Number(variant.price).toLocaleString()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    )}

    <div className="swiss-grid-line mb-6" />

    <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
      {product.description}
    </p>

    <m.div className="mb-6" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button
        onClick={onARTryOn}
        disabled={!hasModel}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-sm font-bold tracking-[0.1em] uppercase ar-pulse relative overflow-hidden"
      >
        <Camera size={20} className="mr-3" />
        AR Virtual Try-On
        <span className="ml-3 px-2 py-0.5 bg-primary-foreground/20 text-[10px] font-bold">
          BETA
        </span>
      </Button>
    </m.div>

    <div className="flex gap-3 mb-8">
      <Button
        size="lg"
        className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-6 font-semibold tracking-wide"
        onClick={onAddToCart}
        disabled={!canAddToCart || isAdding}
      >
        <ShoppingBag size={18} className="mr-2" />
        Add to Bag
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onFavoriteToggle}
        className={`px-6 py-6 border-2 ${
          isFavorite ? "text-primary border-primary" : "border-border"
        }`}
      >
        <Heart size={18} className={isFavorite ? "fill-primary" : ""} />
      </Button>
    </div>

    <div className="space-y-4 border-t-2 border-foreground pt-8 mb-8">
      <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Product Details</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">SKU</p>
          <p className="font-semibold">{selectedVariant?.sku || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Variant</p>
          <p className="font-semibold">{selectedVariant?.name || "Standard"}</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-secondary">
        <Truck size={20} className="mx-auto mb-2 text-primary" />
        <p className="text-[10px] font-semibold uppercase tracking-wide">Free Delivery</p>
      </div>
      <div className="text-center p-4 bg-secondary">
        <Shield size={20} className="mx-auto mb-2 text-primary" />
        <p className="text-[10px] font-semibold uppercase tracking-wide">Authentic</p>
      </div>
      <div className="text-center p-4 bg-secondary">
        <RotateCcw size={20} className="mx-auto mb-2 text-primary" />
        <p className="text-[10px] font-semibold uppercase tracking-wide">30-Day Return</p>
      </div>
    </div>
  </m.div>
);

export default ProductInfoPanel;
