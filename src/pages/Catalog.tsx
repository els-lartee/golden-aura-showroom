import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";

const Catalog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const priceRanges = [
    { label: "Under GH₵2,000", min: 0, max: 2000 },
    { label: "GH₵2,000 - GH₵4,000", min: 2000, max: 4000 },
    { label: "GH₵4,000 - GH₵6,000", min: 4000, max: 6000 },
    { label: "Above GH₵6,000", min: 6000, max: Infinity },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Page Header */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Our Collections
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Explore our curated selection of handcrafted jewellery pieces, 
              each designed to make you shine.
            </p>
          </motion.div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                {/* Categories */}
                <div>
                  <h3 className="font-serif text-lg mb-4">Categories</h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category}>
                        <button
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left py-2 px-3 rounded-sm transition-colors ${
                            selectedCategory === category
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-serif text-lg mb-4">Price Range</h3>
                  <ul className="space-y-2">
                    {priceRanges.map((range) => (
                      <li key={range.label}>
                        <label className="flex items-center gap-3 cursor-pointer text-foreground hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm">{range.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Material */}
                <div>
                  <h3 className="font-serif text-lg mb-4">Material</h3>
                  <ul className="space-y-2">
                    {["18k Gold", "22k Gold", "Rose Gold", "Platinum"].map(
                      (material) => (
                        <li key={material}>
                          <label className="flex items-center gap-3 cursor-pointer text-foreground hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">{material}</span>
                          </label>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-foreground text-background shadow-lg px-6"
              >
                <SlidersHorizontal size={18} className="mr-2" />
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
                    transition={{ type: "tween", duration: 0.3 }}
                    className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 p-6 overflow-y-auto lg:hidden"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="font-serif text-xl">Filters</h2>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-8">
                      {/* Categories */}
                      <div>
                        <h3 className="font-serif text-lg mb-4">Categories</h3>
                        <ul className="space-y-2">
                          {categories.map((category) => (
                            <li key={category}>
                              <button
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setIsSidebarOpen(false);
                                }}
                                className={`w-full text-left py-2 px-3 rounded-sm transition-colors ${
                                  selectedCategory === category
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-secondary"
                                }`}
                              >
                                {category}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h3 className="font-serif text-lg mb-4">Price Range</h3>
                        <ul className="space-y-2">
                          {priceRanges.map((range) => (
                            <li key={range.label}>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-primary"
                                />
                                <span className="text-sm">{range.label}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground text-sm">
                  {filteredProducts.length} products
                </p>
                <select className="bg-secondary border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-primary">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                </select>
              </div>

              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
              >
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
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
