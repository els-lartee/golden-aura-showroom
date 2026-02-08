import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ARModal from "@/components/ARModal";
import { apiClient } from "@/lib/api";
import { getProductCategory, getProductImages, getProductModelUrl } from "@/lib/productAdapters";
import type { ApiCategory, ApiCollection, ApiProduct, ApiTag } from "@/lib/types";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useMe } from "@/hooks/useAuth";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { trackEventSafe } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";

const ProductGallery = lazy(() => import("./product-detail/ProductGallery"));
const ProductInfoPanel = lazy(() => import("./product-detail/ProductInfoPanel"));
const RecommendedProducts = lazy(() => import("./product-detail/RecommendedProducts"));

/**
 * ProductDetail Page - Swiss Design with AR Integration
 * 
 * Features:
 * - Clean grid layout with high contrast
 * - Bold sans-serif typography
 * - Prominent AR Virtual Try-On button
 * - Dynamic AR model loading from backend
 */
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const { data: collections = [] } = useQuery<ApiCollection[]>({
    queryKey: ["collections"],
    queryFn: () => apiClient.get<ApiCollection[]>("/collections/"),
  });
  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ApiCategory[]>("/categories/"),
  });
  const { data: tags = [] } = useQuery<ApiTag[]>({
    queryKey: ["tags"],
    queryFn: () => apiClient.get<ApiTag[]>("/tags/"),
  });

  const { data: product, isLoading: isProductLoading } = useQuery<ApiProduct>({
    queryKey: ["product", id],
    queryFn: () => apiClient.get<ApiProduct>(`/products/${id}/`),
    enabled: Boolean(id),
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [activeProductName, setActiveProductName] = useState<string | null>(null);
  const [activeModelUrl, setActiveModelUrl] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const { data: favorites = [] } = useFavorites(Boolean(me?.user));
  const toggleFavorite = useToggleFavorite();

  const images = useMemo(() => (product ? getProductImages(product) : []), [product]);
  const category = useMemo(
    () => (product ? getProductCategory(product, categories, collections) : "Category"),
    [product, categories, collections]
  );
  const tagNames = useMemo(() => {
    if (!product?.tags?.length) return [] as string[];
    const lookup = new Map(tags.map((tag) => [tag.id, tag.name]));
    return product.tags.map((tagId) => lookup.get(tagId)).filter(Boolean) as string[];
  }, [product?.tags, tags]);

  const defaultVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((variant) => variant.is_active) ?? product.variants[0];
  }, [product?.variants]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    if (!selectedVariantId) return defaultVariant;
    return (
      product.variants.find((variant) => String(variant.id) === selectedVariantId) ??
      defaultVariant
    );
  }, [defaultVariant, product?.variants, selectedVariantId]);

  const canAddToCart = Boolean(cart && selectedVariant && selectedVariant.is_active);

  useEffect(() => {
    if (!defaultVariant) return;
    setSelectedVariantId(String(defaultVariant.id));
  }, [defaultVariant, product?.id]);

  const viewStartRef = useRef<number | null>(null);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.product)),
    [favorites]
  );

  const isFavorite = product ? favoriteIds.has(product.id) : false;

  type Recommendation = { id: number; user: number; product: number; score: string | number };

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations", me?.user?.id],
    queryFn: () => apiClient.get<Recommendation[]>("/recommendations/", { user_id: me?.user?.id }),
    enabled: Boolean(me?.user?.id),
  });

  const { data: recommendedProducts = [], isLoading: isRecommendationsLoading } = useQuery<
    ApiProduct[]
  >({
    queryKey: ["recommended-products", recommendations],
    queryFn: async () => {
      if (!recommendations.length) return [];
      const productIds = recommendations
        .map((rec) => rec.product)
        .filter(Boolean)
        .slice(0, 8);
      const products = await Promise.all(
        productIds.map((productId) => apiClient.get<ApiProduct>(`/products/${productId}/`))
      );
      return products;
    },
    enabled: recommendations.length > 0,
  });

  const { data: collectionRecommendedProducts = [] } = useQuery<ApiProduct[]>({
    queryKey: ["recommended-collection", product?.collections?.[0]],
    queryFn: () =>
      apiClient.get<ApiProduct[]>("/products/", {
        collection: product?.collections?.[0],
        sort: "-is_featured",
      }),
    enabled: Boolean(product?.collections?.length),
  });

  const activeRecommended = recommendedProducts.length
    ? recommendedProducts
    : collectionRecommendedProducts;

  const filteredActiveRecommended = activeRecommended
    .filter((item) => String(item.id) !== id)
    .slice(0, 4);

  const hasModel = Boolean(product && getProductModelUrl(product));

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  /**
   * Handle AR Try-On button click.
   */
  const handleARTryOn = () => {
    if (product) {
      const modelUrl = getProductModelUrl(product);
      if (!modelUrl) {
        toast({
          title: "AR model unavailable",
          description: "This item does not have a 3D model yet.",
          variant: "destructive",
        });
        return;
      }
      setActiveProductName(product.title);
      setActiveModelUrl(modelUrl);
      setIsTryOnOpen(true);
    }
  };

  const handleAddToCart = () => {
    if (!cart || !selectedVariant || !product) return;
    addToCart.mutate(
      {
        cart: cart.id,
        product_variant: selectedVariant.id,
        quantity: 1,
      },
      {
        onSuccess: () => {
          toast({ title: "Added to bag" });
          trackEventSafe({
            event_type: "add_to_cart",
            product: product.id,
            user: me?.user?.id,
          });
        },
        onError: (error) => {
          const message =
            (error as { message?: string })?.message || "Add to cart failed";
          toast({
            title: "Add to bag failed",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  };

  /**
   * Handle AR try-on for recommended products
   */
  const handleRecommendedARTryOn = (productId: string) => {
    const productData = activeRecommended.find(p => String(p.id) === productId);
    if (productData) {
      const modelUrl = getProductModelUrl(productData);
      if (!modelUrl) {
        toast({
          title: "AR model unavailable",
          description: "This item does not have a 3D model yet.",
          variant: "destructive",
        });
        return;
      }
      setActiveProductName(productData.title);
      setActiveModelUrl(modelUrl);
      setIsTryOnOpen(true);
    }
  };

  useEffect(() => {
    if (!product?.id) return undefined;
    viewStartRef.current = Date.now();
    const productId = product.id;
    return () => {
      const start = viewStartRef.current;
      if (!start) return;
      const seconds = Math.round((Date.now() - start) / 1000);
      if (seconds < 1) return;
      trackEventSafe({
        event_type: "view",
        product: productId,
        user: me?.user?.id,
        metadata: { seconds },
      });
    };
  }, [me?.user?.id, product?.id]);

  const handleFavoriteToggle = (productId: number) => {
    if (!me?.user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive",
      });
      return;
    }
    toggleFavorite.mutate(productId, {
      onError: (error) => {
        const message = (error as { message?: string })?.message || "Favorite update failed";
        toast({
          title: "Favorite failed",
          description: message,
          variant: "destructive",
        });
      },
    });
  };

  if (isProductLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb - Swiss Style */}
          <m.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-8 pt-4"
          >
            <Link to="/" className="hover:text-foreground transition-colors uppercase tracking-wide">
              Home
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-foreground transition-colors uppercase tracking-wide">
              Collections
            </Link>
            <span>/</span>
            <span className="text-foreground uppercase tracking-wide">{product.title}</span>
          </m.nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            <Suspense fallback={<div className="min-h-[420px]" />}>
              <ProductGallery
                images={images}
                selectedIndex={selectedImageIndex}
                onSelectImage={setSelectedImageIndex}
                onNext={nextImage}
                onPrev={prevImage}
                productTitle={product.title}
              />
            </Suspense>

            <Suspense fallback={<div className="min-h-[420px]" />}>
              <ProductInfoPanel
                product={product}
                category={category}
                tagNames={tagNames}
                selectedVariantId={selectedVariantId}
                onVariantChange={setSelectedVariantId}
                selectedVariant={selectedVariant}
                canAddToCart={canAddToCart}
                isAdding={addToCart.isPending}
                isFavorite={isFavorite}
                onAddToCart={handleAddToCart}
                onFavoriteToggle={() => handleFavoriteToggle(product.id)}
                onARTryOn={handleARTryOn}
                hasModel={hasModel}
              />
            </Suspense>
          </div>

          <Suspense fallback={<div className="min-h-[200px]" />}>
            <RecommendedProducts
              items={filteredActiveRecommended}
              categories={categories}
              collections={collections}
              favoriteIds={favoriteIds}
              onFavoriteToggle={handleFavoriteToggle}
              onARTryOn={handleRecommendedARTryOn}
              onProductClick={(productId) =>
                trackEventSafe({
                  event_type: "click",
                  product: Number(productId),
                  user: me?.user?.id,
                })
              }
              isLoading={isRecommendationsLoading}
            />
          </Suspense>
        </div>
      </main>
      <Footer />

      {/* AR Modal - Rendered via Portal */}
      <ARModal
        isOpen={isTryOnOpen}
        modelUrl={activeModelUrl}
        productName={activeProductName}
        onClose={() => {
          setIsTryOnOpen(false);
          setActiveModelUrl(null);
        }}
      />
    </div>
  );
};

export default ProductDetail;

