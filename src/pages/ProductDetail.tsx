import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-primary transition-colors">
              Collections
            </Link>
            <span>/</span>
            <Link
              to={`/catalog?category=${product.category}`}
              className="hover:text-primary transition-colors"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-secondary rounded-sm overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 rounded-sm overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? "ring-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
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
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:py-4"
            >
              {product.isNew && (
                <span className="inline-block px-3 py-1 bg-gradient-gold text-primary-foreground text-xs font-medium tracking-wide rounded-sm mb-4">
                  NEW ARRIVAL
                </span>
              )}

              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">
                {product.category}
              </p>

              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                {product.name}
              </h1>

              <p className="text-2xl font-medium text-foreground mb-6">
                GH₵ {product.price.toLocaleString()}
              </p>

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* AR Try-On Button - PROMINENT */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="mb-6"
              >
                <Button
                  size="lg"
                  className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground py-6 text-base font-medium tracking-wide shimmer relative overflow-hidden group"
                >
                  <Camera size={22} className="mr-3" />
                  AR Virtual Try-On
                  <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs">
                    NEW
                  </span>
                </Button>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <Button
                  size="lg"
                  className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-6"
                >
                  <ShoppingBag size={18} className="mr-2" />
                  Add to Bag
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`px-6 py-6 border-border ${
                    isFavorite ? "text-primary border-primary" : ""
                  }`}
                >
                  <Heart
                    size={18}
                    className={isFavorite ? "fill-primary" : ""}
                  />
                </Button>
              </div>

              {/* Product Details */}
              <div className="space-y-4 border-t border-border pt-8 mb-8">
                <h3 className="font-serif text-lg">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Material</p>
                    <p className="font-medium">{product.material}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{product.weight}</p>
                  </div>
                  {product.dimensions && (
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="font-medium">{product.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Free Delivery</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Shield size={18} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Authentic</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <RotateCcw size={18} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">30-Day Return</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <section className="mt-20 pt-12 border-t border-border">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center mb-12">
                  <p className="text-primary text-sm tracking-[0.2em] uppercase mb-3">
                    AI-Powered Suggestions
                  </p>
                  <h2 className="font-serif text-3xl text-foreground">
                    Recommended for You
                  </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
                    />
                  ))}
                </div>
              </motion.div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
