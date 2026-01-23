import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * HeroSection Component - Swiss Design Style
 * 
 * Features:
 * - Bold, oversized typography
 * - Clean grid-based layout
 * - High contrast black/white with gold accent
 * - Minimal decorative elements
 */
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-foreground">
      {/* Background Image with Swiss-style treatment */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80"
          alt="Luxury jewellery"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      {/* Content - Swiss Grid Layout */}
      <div className="relative container mx-auto px-4 py-32">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Swiss-style label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="swiss-subheading text-primary mb-6"
            >
              The New Collection
            </motion.p>
            
            {/* Bold display typography */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="swiss-display text-background mb-8"
            >
              Timeless
              <br />
              <span className="text-primary">Elegance</span>
            </motion.h1>

            {/* Swiss horizontal rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="w-24 h-1 bg-primary mb-8 origin-left"
            />
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-background/70 text-lg mb-10 max-w-lg font-light leading-relaxed"
            >
              Discover our exquisite collection of handcrafted jewellery, 
              where every piece tells a story of artistry and passion.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/catalog">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-xs font-bold tracking-[0.15em] uppercase group"
                >
                  Explore Collection
                  <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/catalog?filter=new">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-background/40 text-background hover:bg-background hover:text-foreground px-8 py-6 text-xs font-bold tracking-[0.15em] uppercase"
                >
                  New Arrivals
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Swiss Grid Accent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-8 left-4 right-4 flex items-end justify-between text-background/40 text-xs font-bold tracking-[0.15em] uppercase"
        >
          <span>Est. 2010</span>
          <span>Accra, Ghana</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

