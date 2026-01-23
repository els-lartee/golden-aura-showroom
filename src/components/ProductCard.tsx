import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage: string;
  category: string;
  isNew?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onARTryOn?: (productId: string) => void;
  arEnabled?: boolean;
  variant?: "default" | "large" | "wide";
}

/**
 * ProductCard Component - Vogue Editorial Style
 * 
 * Features:
 * - Refined serif typography
 * - Elegant hover transitions
 * - Editorial image treatment
 * - Prominent AR try-on button
 */
const ProductCard = ({
  id,
  name,
  price,
  image,
  hoverImage,
  category,
  isNew = false,
  isFavorite = false,
  onFavoriteToggle,
  onARTryOn,
  arEnabled = true,
  variant = "default",
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const aspectRatio = variant === "wide" ? "aspect-[16/9]" : variant === "large" ? "aspect-[3/4]" : "aspect-[3/4]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="group"
    >
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/product/${id}`} className="block">
          <div className={`relative ${aspectRatio} overflow-hidden bg-secondary`}>
            {/* Main Image */}
            <motion.img
              src={image}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover editorial-image"
              animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 1.02 : 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            
            {/* Hover Image */}
            <motion.img
              src={hoverImage}
              alt={`${name} - alternate view`}
              className="absolute inset-0 w-full h-full object-cover editorial-image"
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 1.02 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />

            {/* New Badge - Editorial Style */}
            {isNew && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground vogue-subheading text-[9px]">
                New
              </div>
            )}

            {/* Subtle gradient overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </Link>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle?.();
          }}
          className="absolute top-4 right-4 p-2.5 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background"
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            className={`transition-colors duration-300 ${
              isFavorite ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </button>

        {/* AR Try-On Button */}
        {arEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-4 left-4 right-4"
          >
            <Button
              onClick={(e) => {
                e.preventDefault();
                onARTryOn?.(id);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground vogue-subheading text-[9px] py-3 ar-pulse"
              size="sm"
            >
              <Camera size={14} className="mr-2" strokeWidth={1.5} />
              Virtual Try-On
            </Button>
          </motion.div>
        )}
      </div>

      {/* Product Info - Vogue Typography */}
      <div className="mt-5 space-y-2">
        <p className="vogue-subheading text-muted-foreground text-[9px]">
          {category}
        </p>
        <Link to={`/product/${id}`}>
          <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
            {name}
          </h3>
        </Link>
        <p className="vogue-subheading text-foreground text-[11px]">
          GH₵ {price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
