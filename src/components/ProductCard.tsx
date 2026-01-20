import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

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
}

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
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Link
        to={`/product/${id}`}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary rounded-sm">
          {/* Main Image */}
          <motion.img
            src={image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: isHovered ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Hover Image */}
          <motion.img
            src={hoverImage}
            alt={`${name} - alternate view`}
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* New Badge */}
          {isNew && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-gold text-primary-foreground text-xs font-medium tracking-wide rounded-sm">
              NEW
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle?.();
            }}
            className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <Heart
              size={18}
              className={`transition-colors ${
                isFavorite ? "fill-primary text-primary" : "text-foreground"
              }`}
            />
          </button>

          {/* Quick View Overlay */}
          <motion.div
            className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-foreground/60 to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-background text-sm font-medium">
              Quick View
            </span>
          </motion.div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4 space-y-1">
        <p className="text-muted-foreground text-xs uppercase tracking-wider">
          {category}
        </p>
        <Link to={`/product/${id}`}>
          <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <p className="text-foreground font-medium">
          GH₵ {price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
