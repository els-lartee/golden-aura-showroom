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
}

/**
 * ProductCard Component - Swiss Design Style
 * 
 * Features:
 * - Clean, grid-based layout with sharp edges
 * - Bold typography with tight tracking
 * - High contrast colors
 * - Prominent "Try in AR" button that triggers AR experience
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
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/product/${id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            {/* Main Image */}
            <motion.img
              src={image}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              animate={{ opacity: isHovered ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Hover Image */}
            <motion.img
              src={hoverImage}
              alt={`${name} - alternate view`}
              className="absolute inset-0 w-full h-full object-cover"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* New Badge - Swiss Style */}
            {isNew && (
              <div className="absolute top-0 left-0 px-3 py-1 bg-foreground text-background text-[10px] font-bold tracking-[0.15em] uppercase">
                New
              </div>
            )}
          </div>
        </Link>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle?.();
          }}
          className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <Heart
            size={16}
            className={`transition-colors ${
              isFavorite ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </button>

        {/* AR Try-On Button - Prominent Swiss Style */}
        {arEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-3 right-3"
          >
            <Button
              onClick={(e) => {
                e.preventDefault();
                onARTryOn?.(id);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide text-xs py-2 ar-pulse"
              size="sm"
            >
              <Camera size={14} className="mr-2" />
              Try in AR
            </Button>
          </motion.div>
        )}
      </div>

      {/* Product Info - Swiss Typography */}
      <div className="mt-4 space-y-1">
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.15em]">
          {category}
        </p>
        <Link to={`/product/${id}`}>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight">
            {name}
          </h3>
        </Link>
        <p className="text-foreground font-bold text-sm">
          GH₵ {price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;

