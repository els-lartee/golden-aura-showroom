import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ARModal from "@/components/ARModal";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { getProductCategory, getProductImages } from "@/lib/productAdapters";
import type { ApiCategory, ApiCollection, ApiProduct, ApiTag } from "@/lib/types";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useMe } from "@/hooks/useAuth";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { trackEventSafe } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";

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
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const canAddToCart = Boolean(cart && product?.variants?.length);
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
      setActiveProductName(product.title);
      setIsTryOnOpen(true);
    }
  };

  /**
   * Handle AR try-on for recommended products
   */
  const handleRecommendedARTryOn = (productId: string) => {
    const productData = activeRecommended.find(p => String(p.id) === productId);
    if (productData) {
      setActiveProductName(productData.title);
      setIsTryOnOpen(true);
    }
  };

  useEffect(() => {
    if (!product?.id) return;
    trackEventSafe({
      event_type: "view",
      product: product.id,
      user: me?.user?.id,
    });
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
          <motion.nav
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
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-secondary overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-background text-xs font-bold tracking-wide">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-foreground"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
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

              <h1 className="swiss-heading text-foreground mb-4">
                {product.title}
              </h1>

              <p className="text-2xl font-bold text-foreground mb-6 tracking-tight">
                GH₵ {Number(product.base_price).toLocaleString()}
              </p>

              <div className="swiss-grid-line mb-6" />

              <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
                {product.description}
              </p>

              {/* AR Try-On Button - PROMINENT SWISS STYLE */}
              <motion.div
                className="mb-6"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={handleARTryOn}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-sm font-bold tracking-[0.1em] uppercase ar-pulse relative overflow-hidden"
                >
                  <Camera size={20} className="mr-3" />
                  AR Virtual Try-On
                  <span className="ml-3 px-2 py-0.5 bg-primary-foreground/20 text-[10px] font-bold">
                    BETA
                  </span>
                </Button>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <Button
                  size="lg"
                  className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-6 font-semibold tracking-wide"
                  onClick={() => {
                    if (!cart || !product.variants?.length) return;
                    addToCart.mutate(
                      {
                        cart: cart.id,
                        product_variant: product.variants[0].id,
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
                  }}
                  disabled={!canAddToCart || addToCart.isPending}
                >
                  <ShoppingBag size={18} className="mr-2" />
                  Add to Bag
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleFavoriteToggle(product.id)}
                  className={`px-6 py-6 border-2 ${
                    isFavorite ? "text-primary border-primary" : "border-border"
                  }`}
                >
                  <Heart
                    size={18}
                    className={isFavorite ? "fill-primary" : ""}
                  />
                </Button>
              </div>

              {/* Product Details */}
              <div className="space-y-4 border-t-2 border-foreground pt-8 mb-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">SKU</p>
                    <p className="font-semibold">{product.variants?.[0]?.sku || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Variant</p>
                    <p className="font-semibold">{product.variants?.[0]?.name || "Standard"}</p>
                  </div>
                </div>
              </div>

              {/* Trust Badges - Swiss Grid */}
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
            </motion.div>
          </div>

          {/* Recommended Products */}
          {filteredActiveRecommended.length > 0 && (
            <section className="mt-20 pt-12 border-t-2 border-foreground">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-12">
                  <p className="swiss-subheading text-primary mb-2">
                    AI-Powered Suggestions
                  </p>
                  <h2 className="swiss-heading text-foreground">
                    Recommended for You
                  </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredActiveRecommended.map((item) => {
                    const recImages = getProductImages(item);
                    const recCategory = getProductCategory(item, categories, collections);
                    const recIsFavorite = favoriteIds.has(item.id);
                    return (
                    <ProductCard
                      key={item.id}
                      id={String(item.id)}
                      name={item.title}
                      price={Number(item.base_price)}
                      image={recImages[0]}
                      hoverImage={recImages[1] || recImages[0]}
                      category={recCategory}
                      isNew={item.is_featured}
                      isFavorite={recIsFavorite}
                      onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                      onARTryOn={handleRecommendedARTryOn}
                      onProductClick={(productId) =>
                        trackEventSafe({
                          event_type: "click",
                          product: Number(productId),
                          user: me?.user?.id,
                        })
                      }
                    />
                    );
                  })}
                </div>
                {isRecommendationsLoading && (
                  <p className="mt-4 text-xs text-muted-foreground">Loading recommendations...</p>
                )}
              </motion.div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      {/* AR Modal - Rendered via Portal */}
      <ARModal
        isOpen={isTryOnOpen}
        modelUrl="/ring.glb"
        productName={activeProductName}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;

