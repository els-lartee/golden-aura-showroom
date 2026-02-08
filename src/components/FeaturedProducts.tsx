import { useMemo } from "react";
import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import { apiClient } from "@/lib/api";
import { getProductCategory, getProductImages } from "@/lib/productAdapters";
import type { ApiCategory, ApiCollection, ApiProduct } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * FeaturedProducts Component - Vogue Editorial Style
 * 
 * Features:
 * - Magazine-style layout with asymmetric grid
 * - Elegant serif typography
 * - Editorial spacing and rhythm
 */
const FeaturedProducts = () => {
  const { data: products = [], isLoading } = useQuery<ApiProduct[]>({
    queryKey: ["products", "featured"],
    queryFn: () => apiClient.get<ApiProduct[]>("/products/", { sort: "-is_featured" }),
  });
  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ApiCategory[]>("/categories/"),
  });
  const { data: collections = [] } = useQuery<ApiCollection[]>({
    queryKey: ["collections"],
    queryFn: () => apiClient.get<ApiCollection[]>("/collections/"),
  });

  const featuredProducts = useMemo(() => {
    if (!products.length) return [];
    const featured = products.filter((product) => product.is_featured);
    const source = featured.length ? featured : products;
    return source.slice(0, 4);
  }, [products]);

  const buildCardData = (product: ApiProduct) => {
    const images = getProductImages(product);
    return {
      id: String(product.id),
      name: product.title,
      price: Number(product.base_price) || 0,
      image: images[0],
      hoverImage: images[1] ?? images[0],
      category: getProductCategory(product, categories, collections),
      isNew: product.is_featured,
    };
  };

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        {/* Editorial Header */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20"
        >
          <div className="max-w-xl">
            <p className="vogue-subheading text-primary mb-4">
              Curated Selection
            </p>
            <h2 className="vogue-heading text-foreground">
              Featured Pieces
            </h2>
            <div className="editorial-line mt-6" />
          </div>
          <Link
            to="/catalog"
            className="mt-8 md:mt-0 vogue-link text-foreground/70 hover:text-foreground transition-colors duration-300 flex items-center gap-3 vogue-subheading text-[10px]"
          >
            View All Collection
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </m.div>

        {/* Vogue-style asymmetric grid */}
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            <div className="col-span-12 md:col-span-6">
              <Skeleton className="w-full aspect-[3/4]" />
            </div>
            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-6 md:gap-8">
              <Skeleton className="w-full aspect-[3/4]" />
              <Skeleton className="w-full aspect-[3/4]" />
              <div className="col-span-2">
                <Skeleton className="w-full aspect-[16/9]" />
              </div>
            </div>
          </div>
        ) : featuredProducts.length ? (
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            {/* Large featured item */}
            {featuredProducts[0] && (
              <m.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="col-span-12 md:col-span-6"
              >
                <ProductCard {...buildCardData(featuredProducts[0])} variant="large" />
              </m.div>
            )}

            {/* Stacked items on right */}
            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-6 md:gap-8">
              {featuredProducts.slice(1, 3).map((product, index) => (
                <m.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  className="col-span-1"
                >
                  <ProductCard {...buildCardData(product)} />
                </m.div>
              ))}

              {/* Fourth item spans both columns */}
              {featuredProducts[3] && (
                <m.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="col-span-2"
                >
                  <ProductCard {...buildCardData(featuredProducts[3])} variant="wide" />
                </m.div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-sm p-10 text-center text-muted-foreground">
            No featured products yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
