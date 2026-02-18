import { lazy, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
const ARModal = lazy(() => import("@/components/ARModal"));
import RecommendationsStrip from "@/components/RecommendationsStrip";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { getProductCategory, getProductImages, getProductModelUrl } from "@/lib/productAdapters";
import { getProductJewelryType, type JewelryType } from "@/lib/jewelryConfig";
import { trackEventSafe } from "@/hooks/useAnalytics";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import type { ApiCategory, ApiCollection, ApiProduct, ApiTag } from "@/lib/types";
import { useMe } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [selectedCollection, setSelectedCollection] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [activeProductName, setActiveProductName] = useState<string | null>(null);
  const [activeModelUrl, setActiveModelUrl] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [activeJewelryType, setActiveJewelryType] = useState<JewelryType | null>(null);
  const { data: me } = useMe();
  const { toast } = useToast();
  const { data: favorites = [] } = useFavorites(Boolean(me?.user));
  const toggleFavorite = useToggleFavorite();

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

  const sortParam = useMemo(() => {
    if (selectedSort === "price_asc") return "base_price";
    if (selectedSort === "price_desc") return "-base_price";
    if (selectedSort === "newest") return "-created_at";
    return "-is_featured";
  }, [selectedSort]);

  const clearSearch = () => {
    setSearchParams((prev) => {
      prev.delete("query");
      return prev;
    });
  };

  const { data: products = [], isLoading } = useQuery<ApiProduct[]>({
    queryKey: ["products", selectedCollection, selectedCategory, selectedTag, sortParam, searchQuery],
    queryFn: () =>
      apiClient.get<ApiProduct[]>("/products/", {
        collection: selectedCollection === "All" ? undefined : selectedCollection,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        tag: selectedTag === "All" ? undefined : selectedTag,
        sort: sortParam,
        query: searchQuery || undefined,
      }),
  });

  const collectionOptions = useMemo(() => {
    const base = collections.map((collection) => ({
      label: collection.name,
      value: String(collection.id),
    }));
    return [{ label: "All", value: "All" }, ...base];
  }, [collections]);

  const categoryOptions = useMemo(() => {
    const base = categories.map((category) => ({
      label: category.name,
      value: String(category.id),
    }));
    return [{ label: "All", value: "All" }, ...base];
  }, [categories]);

  const tagOptions = useMemo(() => {
    const base = tags.map((tag) => ({ label: tag.name, value: String(tag.id) }));
    return [{ label: "All", value: "All" }, ...base];
  }, [tags]);

  const handleARTryOn = (productId: string) => {
    const product = products.find((p) => String(p.id) === productId);
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
      setActiveProductId(product.id);
      setActiveJewelryType(getProductJewelryType(product, categories) ?? "ring");
      setIsTryOnOpen(true);
    }
  };

  const handleProductClick = (productId: string) => {
    trackEventSafe({
      event_type: "click",
      product: Number(productId),
      user: me?.user?.id,
    });
  };

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.product)),
    [favorites]
  );

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header - Swiss Style */}
              <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="swiss-subheading text-primary mb-2">
              {searchQuery ? "Search Results" : "Browse"}
            </p>
            <h1 className="swiss-heading text-foreground mb-4">
              {searchQuery ? `"${searchQuery}"` : "Our Collections"}
            </h1>
            <div className="w-16 h-1 bg-foreground" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
                Clear search
              </button>
            )}
              </m.div>

          <RecommendationsStrip />

          <div className="flex gap-8">
            {/* Desktop Sidebar - Swiss Minimal */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Collections</h3>
                  <ul className="space-y-1">
                    {collectionOptions.map((collection) => (
                      <li key={collection.value}>
                        <button
                          onClick={() => setSelectedCollection(collection.value)}
                          className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                            selectedCollection === collection.value
                              ? "bg-foreground text-background"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {collection.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Categories</h3>
                  <ul className="space-y-1">
                    {categoryOptions.map((category) => (
                      <li key={category.value}>
                        <button
                          onClick={() => setSelectedCategory(category.value)}
                          className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                            selectedCategory === category.value
                              ? "bg-foreground text-background"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {category.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Tags</h3>
                  <ul className="space-y-1">
                    {tagOptions.map((tag) => (
                      <li key={tag.value}>
                        <button
                          onClick={() => setSelectedTag(tag.value)}
                          className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                            selectedTag === tag.value
                              ? "bg-foreground text-background"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {tag.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-foreground text-background shadow-lg px-6 font-bold text-xs tracking-wide uppercase"
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
              </Button>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <m.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed left-0 top-0 bottom-0 w-72 bg-background z-50 p-6 lg:hidden border-r-2 border-foreground"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-sm font-bold uppercase tracking-[0.15em]">Filters</h2>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-2">
                        <X size={20} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Collections</h3>
                      <ul className="space-y-1">
                        {collectionOptions.map((collection) => (
                          <li key={collection.value}>
                            <button
                              onClick={() => {
                                setSelectedCollection(collection.value);
                                setIsSidebarOpen(false);
                              }}
                              className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                                selectedCollection === collection.value
                                  ? "bg-foreground text-background"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              {collection.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Categories</h3>
                      <ul className="space-y-1">
                        {categoryOptions.map((category) => (
                          <li key={category.value}>
                            <button
                              onClick={() => {
                                setSelectedCategory(category.value);
                                setIsSidebarOpen(false);
                              }}
                              className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                                selectedCategory === category.value
                                  ? "bg-foreground text-background"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              {category.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Tags</h3>
                      <ul className="space-y-1">
                        {tagOptions.map((tag) => (
                          <li key={tag.value}>
                            <button
                              onClick={() => {
                                setSelectedTag(tag.value);
                                setIsSidebarOpen(false);
                              }}
                              className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                                selectedTag === tag.value
                                  ? "bg-foreground text-background"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              {tag.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </m.aside>
                </>
              )}
            </AnimatePresence>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {products.length} Products
                </p>
                <select
                  value={selectedSort}
                  onChange={(event) => setSelectedSort(event.target.value)}
                  className="bg-secondary border-2 border-foreground px-4 py-2 text-xs font-bold tracking-wide focus:outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              <m.div layout className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {products.map((product) => {
                    const images = getProductImages(product);
                    const category = getProductCategory(product, categories, collections);
                    const modelUrl = getProductModelUrl(product);
                    const price = Number(product.base_price);
                    return (
                    <ProductCard
                      key={product.id}
                      id={String(product.id)}
                      name={product.title}
                      price={Number.isNaN(price) ? 0 : price}
                      image={images[0]}
                      hoverImage={images[1] || images[0]}
                      category={category}
                      isNew={product.is_featured}
                      isFavorite={favoriteIds.has(product.id)}
                      arEnabled={Boolean(modelUrl)}
                      onFavoriteToggle={() => handleFavoriteToggle(product.id)}
                      onARTryOn={handleARTryOn}
                      onProductClick={handleProductClick}
                    />
                    );
                  })}
                  {!isLoading && products.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-secondary rounded-sm">
                      <p className="text-sm font-semibold text-muted-foreground">
                        No products found.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </m.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {isTryOnOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-white">
              <span className="text-sm uppercase tracking-[0.2em]">Loading AR...</span>
            </div>
          }
        >
          <ARModal
            isOpen={isTryOnOpen}
            modelUrl={activeModelUrl}
            productName={activeProductName}
            productId={activeProductId}
            jewelryType={activeJewelryType ?? undefined}
            onClose={() => {
              setIsTryOnOpen(false);
              setActiveModelUrl(null);
              setActiveProductId(null);
              setActiveJewelryType(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Catalog;

