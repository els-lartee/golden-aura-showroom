import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";
import type { ApiCategory } from "@/lib/types";

/**
 * CollectionBanner Component - Vogue Editorial Style
 * 
 * Features:
 * - Magazine-style collection showcases
 * - Dramatic typography overlays
 * - Elegant hover animations
 */
const CollectionBanner = () => {
  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ApiCategory[]>("/categories/"),
  });

  const collections = [
    {
      name: "Rings",
      description: "Symbols of eternal devotion",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
      link: "/catalog"
    },
    {
      name: "Necklaces",
      description: "Grace for every neckline",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      link: "/catalog"
    },
    {
      name: "Bracelets",
      description: "Elegance in motion",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      link: "/catalog"
    },
    {
      name: "Earrings",
      description: "Frame your radiance",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      link: "/catalog"
    }
  ];

  const categoryLinks = useMemo(() => {
    if (!categories.length) return collections;
    return collections.map((collection) => {
      const match = categories.find(
        (category) => category.name.toLowerCase() === collection.name.toLowerCase(),
      );
      return {
        ...collection,
        link: match ? `/catalog?category=${match.id}` : "/catalog",
      };
    });
  }, [categories, collections]);

  return (
    <section className="py-24 md:py-32 bg-secondary">
      <div className="container mx-auto px-6 md:px-12">
        {/* Editorial Header */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="vogue-subheading text-primary mb-4">
            Explore
          </p>
          <h2 className="vogue-heading text-foreground mb-6">
            Our Collections
          </h2>
          <div className="editorial-line mx-auto" />
        </m.div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Large left banner */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 md:col-span-7"
          >
            <Link to={categoryLinks[0].link} className="block group">
              <div className="relative aspect-[4/5] md:aspect-[4/3] overflow-hidden">
                <img
                  src={collections[0].image}
                  alt={categoryLinks[0].name}
                  className="w-full h-full object-cover editorial-image transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <p className="vogue-subheading text-primary mb-3">
                    Collection
                  </p>
                  <h3 className="font-serif text-4xl md:text-5xl text-background mb-3 italic">
                    {categoryLinks[0].name}
                  </h3>
                  <p className="vogue-caption text-background/80 mb-6">
                    {categoryLinks[0].description}
                  </p>
                  <span className="inline-flex items-center gap-2 vogue-subheading text-[10px] text-background/90 group-hover:text-primary transition-colors duration-300">
                    Explore
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </div>
            </Link>
          </m.div>

          {/* Right stacked banners */}
          <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-4 md:gap-6">
            {categoryLinks.slice(1, 3).map((collection, index) => (
              <m.div
                key={collection.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              >
                <Link to={collection.link} className="block group h-full">
                  <div className="relative h-full min-h-[200px] overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover editorial-image transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <h3 className="font-serif text-2xl md:text-3xl text-background mb-2 italic">
                        {collection.name}
                      </h3>
                      <p className="vogue-caption text-background/80 text-sm">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>

          {/* Bottom wide banner */}
          <m.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-12"
          >
            <Link to={categoryLinks[3].link} className="block group">
              <div className="relative aspect-[21/9] overflow-hidden">
                <img
                  src={collections[3].image}
                  alt={categoryLinks[3].name}
                  className="w-full h-full object-cover editorial-image transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
                
                <div className="absolute inset-0 flex items-center p-8 md:p-16">
                  <div>
                    <p className="vogue-subheading text-primary mb-3">
                      Collection
                    </p>
                    <h3 className="font-serif text-3xl md:text-5xl text-background mb-3 italic">
                      {categoryLinks[3].name}
                    </h3>
                    <p className="vogue-caption text-background/80 mb-6 max-w-md">
                      {categoryLinks[3].description}
                    </p>
                    <span className="inline-flex items-center gap-2 vogue-subheading text-[10px] text-background/90 group-hover:text-primary transition-colors duration-300">
                      Explore Collection
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </m.div>
        </div>
      </div>
    </section>
  );
};

export default CollectionBanner;
