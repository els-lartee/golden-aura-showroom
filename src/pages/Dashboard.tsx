import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  Clock,
  User,
  Settings,
  ShoppingBag,
  LogOut,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";

type TabType = "favorites" | "recent" | "profile";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");

  // Mock data for favorites and recent views
  const [favorites, setFavorites] = useState(products.slice(0, 3));
  const [recentViews] = useState(products.slice(2, 6));

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((p) => p.id !== id));
  };

  const tabs = [
    { id: "favorites" as TabType, label: "Favorites", icon: Heart },
    { id: "recent" as TabType, label: "Recent Views", icon: Clock },
    { id: "profile" as TabType, label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="font-serif text-4xl text-foreground mb-2">
              My Account
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Manage your favorites and preferences.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                ))}
                <div className="hidden lg:block border-t border-border my-4" />
                <button className="hidden lg:flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <Settings size={18} />
                  <span className="font-medium text-sm">Settings</span>
                </button>
                <button className="hidden lg:flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1">
              {/* Favorites Tab */}
              {activeTab === "favorites" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-serif text-2xl">
                      My Favorites ({favorites.length})
                    </h2>
                  </div>

                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {favorites.map((product) => (
                        <div key={product.id} className="relative">
                          <ProductCard
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            image={product.images[0]}
                            hoverImage={product.images[1]}
                            category={product.category}
                            isNew={product.isNew}
                            isFavorite={true}
                            onFavoriteToggle={() => removeFavorite(product.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-secondary rounded-sm">
                      <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-serif text-xl mb-2">
                        No favorites yet
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Start adding pieces you love to your favorites.
                      </p>
                      <Link to="/catalog">
                        <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground">
                          Explore Collection
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Recent Views Tab */}
              {activeTab === "recent" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-serif text-2xl">Recently Viewed</h2>
                    <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Clear History
                    </button>
                  </div>

                  {recentViews.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {recentViews.map((product) => (
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
                  ) : (
                    <div className="text-center py-16 bg-secondary rounded-sm">
                      <Clock size={48} className="mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-serif text-xl mb-2">
                        No recent views
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Start exploring our collection.
                      </p>
                      <Link to="/catalog">
                        <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground">
                          Browse Now
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="font-serif text-2xl mb-6">My Profile</h2>

                  <div className="bg-card border border-border rounded-sm p-6 md:p-8">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                      <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-2xl font-serif">
                        AG
                      </div>
                      <div>
                        <h3 className="font-serif text-xl">Ama Gyamfua</h3>
                        <p className="text-muted-foreground">
                          ama.gyamfua@email.com
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            defaultValue="Ama"
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            defaultValue="Gyamfua"
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          defaultValue="ama.gyamfua@email.com"
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          defaultValue="+233 24 123 4567"
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <Button className="bg-gradient-gold hover:opacity-90 text-primary-foreground">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
