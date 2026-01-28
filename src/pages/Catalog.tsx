import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ARModal from "@/components/ARModal";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";

const Catalog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [activeProductName, setActiveProductName] = useState<string | null>(null);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const handleARTryOn = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setActiveProductName(product.name);
      setIsTryOnOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header - Swiss Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="swiss-subheading text-primary mb-2">Browse</p>
            <h1 className="swiss-heading text-foreground mb-4">Our Collections</h1>
            <div className="w-16 h-1 bg-foreground" />
          </motion.div>

          <div className="flex gap-8">
            {/* Desktop Sidebar - Swiss Minimal */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Categories</h3>
                  <ul className="space-y-1">
                    {categories.map((category) => (
                      <li key={category}>
                        <button
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                            selectedCategory === category
                              ? "bg-foreground text-background"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-foreground text-background shadow-lg px-6 font-bold text-xs tracking-wide uppercase"
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
              </Button>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed left-0 top-0 bottom-0 w-72 bg-background z-50 p-6 lg:hidden border-r-2 border-foreground"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-sm font-bold uppercase tracking-[0.15em]">Filters</h2>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-2">
                        <X size={20} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Categories</h3>
                      <ul className="space-y-1">
                        {categories.map((category) => (
                          <li key={category}>
                            <button
                              onClick={() => {
                                setSelectedCategory(category);
                                setIsSidebarOpen(false);
                              }}
                              className={`w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                                selectedCategory === category
                                  ? "bg-foreground text-background"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              {category}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {filteredProducts.length} Products
                </p>
                <select className="bg-secondary border-2 border-foreground px-4 py-2 text-xs font-bold tracking-wide focus:outline-none">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                </select>
              </div>

              <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0]}
                      hoverImage={product.images[1]}
                      category={product.category}
                      isNew={product.isNew}
                      onARTryOn={handleARTryOn}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <ARModal
        isOpen={isTryOnOpen}
        modelUrl="/ring.glb"
        productName={activeProductName}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  );
};

export default Catalog;

