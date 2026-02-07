import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * HeroSection Component - Vogue Editorial Style
 * 
 * Features:
 * - Dramatic, oversized serif typography
 * - Editorial magazine layout
 * - Cinematic imagery with elegant overlays
 * - Refined, luxurious animations
 */
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-foreground">
      {/* Background Image with editorial treatment */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80"
          alt="Luxury jewellery"
          className="w-full h-full object-cover editorial-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent" />
        <div className="absolute inset-0 bg-foreground/30" />
      </div>

      {/* Editorial Content Layout */}
      <div className="relative container mx-auto px-6 md:px-12 pb-16 md:pb-24 pt-32">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Editorial Marker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden md:block col-span-1 self-end pb-4"
          >
            <div className="w-px h-24 bg-primary/60 mx-auto mb-4" />
            <p className="text-primary/80 text-[10px] tracking-[0.3em] uppercase writing-mode-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              2024 Collection
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-10 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Vogue-style pre-title */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="vogue-subheading text-primary mb-8"
              >
                The New Collection
              </motion.p>
              
              {/* Dramatic display typography */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="vogue-display text-background mb-6"
              >
                Timeless
                <br />
                <span className="text-primary">Elegance</span>
              </motion.h1>

              {/* Editorial divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="editorial-line mb-8 origin-left"
              />
              
              {/* Vogue-style body copy */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="vogue-caption text-background/80 text-lg md:text-xl mb-12 max-w-lg leading-relaxed"
              >
                Discover our exquisite collection of handcrafted jewellery, 
                where every piece tells a story of artistry and passion.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/catalog">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 vogue-subheading text-[11px] group"
                  >
                    Explore Collection
                    <ArrowRight size={14} className="ml-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/catalog?filter=new">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-background bg-transparent text-background hover:bg-background hover:text-foreground px-10 py-7 vogue-subheading text-[11px] transition-all duration-300"
                  >
                    New Arrivals
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Editorial Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="hidden lg:flex col-span-2 flex-col items-end justify-end text-right pb-4"
          >
            <p className="vogue-subheading text-background/50 mb-2">Est. 2026</p>
            <p className="vogue-caption text-background/70">Accra, Ghana</p>
          </motion.div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-transparent via-background/50 to-background/80"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
