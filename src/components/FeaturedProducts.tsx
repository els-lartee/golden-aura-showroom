import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { products } from "@/data/products";

/**
 * FeaturedProducts Component - Vogue Editorial Style
 * 
 * Features:
 * - Magazine-style layout with asymmetric grid
 * - Elegant serif typography
 * - Editorial spacing and rhythm
 */
const FeaturedProducts = () => {
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        {/* Editorial Header */}
        <motion.div
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
        </motion.div>

        {/* Vogue-style asymmetric grid */}
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          {/* Large featured item */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 md:col-span-6"
          >
            <ProductCard
              key={featuredProducts[0].id}
              id={featuredProducts[0].id}
              name={featuredProducts[0].name}
              price={featuredProducts[0].price}
              image={featuredProducts[0].images[0]}
              hoverImage={featuredProducts[0].images[1]}
              category={featuredProducts[0].category}
              isNew={featuredProducts[0].isNew}
              variant="large"
            />
          </motion.div>

          {/* Stacked items on right */}
          <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-6 md:gap-8">
            {featuredProducts.slice(1, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="col-span-1"
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.images[0]}
                  hoverImage={product.images[1]}
                  category={product.category}
                  isNew={product.isNew}
                />
              </motion.div>
            ))}
            
            {/* Fourth item spans both columns */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="col-span-2"
            >
              <ProductCard
                key={featuredProducts[3].id}
                id={featuredProducts[3].id}
                name={featuredProducts[3].name}
                price={featuredProducts[3].price}
                image={featuredProducts[3].images[0]}
                hoverImage={featuredProducts[3].images[1]}
                category={featuredProducts[3].category}
                isNew={featuredProducts[3].isNew}
                variant="wide"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
