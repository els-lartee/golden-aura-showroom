import { useMemo } from "react";
import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";
import { getProductImages } from "@/lib/productAdapters";
import type { ApiProduct } from "@/lib/types";
import { useMe } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Recommendation = { id: number; user: number; product: number; score: string | number };

const RecommendationsStrip = () => {
  const { data: me } = useMe();
  const userId = me?.user?.id;

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations", userId],
    queryFn: () => apiClient.get<Recommendation[]>("/recommendations/", { user_id: userId }),
    enabled: Boolean(userId),
  });

  const { data: recommendedProducts = [], isLoading: isRecommendationsLoading } = useQuery<
    ApiProduct[]
  >({
    queryKey: ["catalog-recommended-products", recommendations],
    queryFn: async () => {
      if (!recommendations.length) return [];
      const productIds = recommendations.map((item) => item.product).slice(0, 5);
      const results = await Promise.allSettled(
        productIds.map((productId) => apiClient.get<ApiProduct>(`/products/${productId}/`))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<ApiProduct> => r.status === "fulfilled")
        .map((r) => r.value);
    },
    enabled: recommendations.length > 0,
  });

  const { data: fallbackProducts = [], isLoading: isFallbackLoading } = useQuery<ApiProduct[]>({
    queryKey: ["catalog-recommendations-fallback"],
    queryFn: () => apiClient.get<ApiProduct[]>("/products/", { sort: "-is_featured" }),
    enabled: !userId || recommendations.length === 0,
  });

  const displayProducts = useMemo(() => {
    const source = recommendedProducts.length ? recommendedProducts : fallbackProducts;
    return source.slice(0, 3);
  }, [recommendedProducts, fallbackProducts]);

  const isLoading = isRecommendationsLoading || (!recommendedProducts.length && isFallbackLoading);

  return (
    <section className="mb-12">
      <div className="rounded-sm bg-foreground text-background px-6 py-10 md:px-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <p className="vogue-subheading text-primary mb-2">Recommended</p>
          <h2 className="font-serif text-2xl md:text-3xl">Your Personalized Bag</h2>
        </m.div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`recommendation-skeleton-${index}`}
                className="flex items-center gap-4 border border-background/30 p-4"
              >
                <Skeleton className="h-16 w-16" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {displayProducts.map((product) => {
              const image = getProductImages(product)[0];
              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group flex items-center gap-4 border border-background/30 p-4 transition-colors duration-300 hover:border-primary"
                >
                  <div className="h-16 w-16 overflow-hidden border border-background/30">
                    {image ? (
                      <img
                        src={image}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-background/10" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-background/60">Image</p>
                    <p className="font-serif text-lg text-background">{product.title}</p>
                    <p className="text-sm text-background/70">GHC {Number(product.base_price).toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-background/30 p-6 text-background/70">
            Recommendations will appear once we have more activity to learn from.
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationsStrip;
