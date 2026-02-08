import { m } from "framer-motion";

import { ProductCard } from "@/components/ProductCard";
import { getProductCategory, getProductImages, getProductModelUrl } from "@/lib/productAdapters";
import type { ApiCollection, ApiCategory, ApiProduct } from "@/lib/types";

type RecommendedProductsProps = {
  items: ApiProduct[];
  categories: ApiCategory[];
  collections: ApiCollection[];
  favoriteIds: Set<number>;
  onFavoriteToggle: (productId: number) => void;
  onARTryOn: (productId: string) => void;
  onProductClick: (productId: string) => void;
  isLoading: boolean;
};

const RecommendedProducts = ({
  items,
  categories,
  collections,
  favoriteIds,
  onFavoriteToggle,
  onARTryOn,
  onProductClick,
  isLoading,
}: RecommendedProductsProps) => {
  if (!items.length) return null;

  return (
    <section className="mt-20 pt-12 border-t-2 border-foreground">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-12">
          <p className="swiss-subheading text-primary mb-2">AI-Powered Suggestions</p>
          <h2 className="swiss-heading text-foreground">Recommended for You</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const recImages = getProductImages(item);
            const recCategory = getProductCategory(item, categories, collections);
            const recIsFavorite = favoriteIds.has(item.id);
            const recModelUrl = getProductModelUrl(item);
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
                arEnabled={Boolean(recModelUrl)}
                onFavoriteToggle={() => onFavoriteToggle(item.id)}
                onARTryOn={onARTryOn}
                onProductClick={onProductClick}
              />
            );
          })}
        </div>
        {isLoading && (
          <p className="mt-4 text-xs text-muted-foreground">Loading recommendations...</p>
        )}
      </m.div>
    </section>
  );
};

export default RecommendedProducts;
