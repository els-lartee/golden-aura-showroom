import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ARModal from "@/components/ARModal";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";

/**
 * ProductDetail Page - Swiss Design with AR Integration
 * 
 * Features:
 * - Clean grid layout with high contrast
 * - Bold sans-serif typography
 * - Prominent AR Virtual Try-On button
 * - Dynamic AR model loading from backend
 */
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [activeProductName, setActiveProductName] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Product not found</p>
      </div>
    );
  }

  const recommendedProducts = products
    .filter((p) => p.id !== id && p.category === product.category)
    .slice(0, 4);

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  /**
   * Handle AR Try-On button click.
   */
  const handleARTryOn = () => {
    setActiveProductName(product.name);
    setIsTryOnOpen(true);
  };

  /**
   * Handle AR try-on for recommended products
   */
  const handleRecommendedARTryOn = (productId: string) => {
    const productData = products.find(p => p.id === productId);
    if (productData) {
      setActiveProductName(productData.name);
      setIsTryOnOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb - Swiss Style */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-8 pt-4"
          >
            <Link to="/" className="hover:text-foreground transition-colors uppercase tracking-wide">
              Home
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-foreground transition-colors uppercase tracking-wide">
              Collections
            </Link>
            <span>/</span>
            <span className="text-foreground uppercase tracking-wide">{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-secondary overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-background text-xs font-bold tracking-wide">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-foreground"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:py-4"
            >
              {product.isNew && (
                <span className="inline-block px-3 py-1 bg-foreground text-background text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
                  New Arrival
                </span>
              )}

              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.15em] mb-2">
                {product.category}
              </p>

              <h1 className="swiss-heading text-foreground mb-4">
                {product.name}
              </h1>

              <p className="text-2xl font-bold text-foreground mb-6 tracking-tight">
                GH₵ {product.price.toLocaleString()}
              </p>

              <div className="swiss-grid-line mb-6" />

              <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
                {product.description}
              </p>

              {/* AR Try-On Button - PROMINENT SWISS STYLE */}
              <motion.div
                className="mb-6"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={handleARTryOn}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-sm font-bold tracking-[0.1em] uppercase ar-pulse relative overflow-hidden"
                >
                  <Camera size={20} className="mr-3" />
                  AR Virtual Try-On
                  <span className="ml-3 px-2 py-0.5 bg-primary-foreground/20 text-[10px] font-bold">
                    BETA
                  </span>
                </Button>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <Button
                  size="lg"
                  className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-6 font-semibold tracking-wide"
                >
                  <ShoppingBag size={18} className="mr-2" />
                  Add to Bag
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`px-6 py-6 border-2 ${
                    isFavorite ? "text-primary border-primary" : "border-border"
                  }`}
                >
                  <Heart
                    size={18}
                    className={isFavorite ? "fill-primary" : ""}
                  />
                </Button>
              </div>

              {/* Product Details */}
              <div className="space-y-4 border-t-2 border-foreground pt-8 mb-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Material</p>
                    <p className="font-semibold">{product.material}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Weight</p>
                    <p className="font-semibold">{product.weight}</p>
                  </div>
                  {product.dimensions && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Dimensions</p>
                      <p className="font-semibold">{product.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Badges - Swiss Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary">
                  <Truck size={20} className="mx-auto mb-2 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Free Delivery</p>
                </div>
                <div className="text-center p-4 bg-secondary">
                  <Shield size={20} className="mx-auto mb-2 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Authentic</p>
                </div>
                <div className="text-center p-4 bg-secondary">
                  <RotateCcw size={20} className="mx-auto mb-2 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide">30-Day Return</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <section className="mt-20 pt-12 border-t-2 border-foreground">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-12">
                  <p className="swiss-subheading text-primary mb-2">
                    AI-Powered Suggestions
                  </p>
                  <h2 className="swiss-heading text-foreground">
                    Recommended for You
                  </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0]}
                      hoverImage={product.images[1]}
                      category={product.category}
                      isNew={product.isNew}
                      onARTryOn={handleRecommendedARTryOn}
                    />
                  ))}
                </div>
              </motion.div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      {/* AR Modal - Rendered via Portal */}
      <ARModal
        isOpen={isTryOnOpen}
        modelUrl="/ring.glb"
        productName={activeProductName}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;

