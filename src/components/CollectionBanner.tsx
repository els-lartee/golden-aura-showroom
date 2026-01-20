import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CollectionBanner = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rings Collection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group overflow-hidden rounded-sm aspect-[4/3] md:aspect-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80"
              alt="Rings Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="text-gold text-xs tracking-[0.2em] uppercase mb-2">
                Collection
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-cream mb-4">
                Rings
              </h3>
              <Link to="/catalog?category=Rings">
                <Button
                  variant="outline"
                  className="border-cream/60 text-cream hover:bg-cream hover:text-foreground group/btn"
                >
                  Explore
                  <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Necklaces Collection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative group overflow-hidden rounded-sm aspect-[4/3] md:aspect-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
              alt="Necklaces Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="text-gold text-xs tracking-[0.2em] uppercase mb-2">
                Collection
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-cream mb-4">
                Necklaces
              </h3>
              <Link to="/catalog?category=Necklaces">
                <Button
                  variant="outline"
                  className="border-cream/60 text-cream hover:bg-cream hover:text-foreground group/btn"
                >
                  Explore
                  <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CollectionBanner;
