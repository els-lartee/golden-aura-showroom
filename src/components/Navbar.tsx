import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, User, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/hooks/useAuth";
import CartDrawer from "@/components/CartDrawer";
import { promotionsApi } from "@/lib/promotions";

/**
 * Navbar Component - Vogue Editorial Style
 * 
 * Features:
 * - Refined serif branding
 * - Elegant, minimal navigation
 * - Sophisticated hover states
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { data: me } = useMe();
  const logout = useLogout();
  const isAuthenticated = Boolean(me?.user);
  const { data: promotions = [] } = useQuery({
    queryKey: ["active-promotions"],
    queryFn: promotionsApi.activePromotions,
  });
  const activePromotion = promotions[0];

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/catalog" },
    { name: "New Arrivals", path: "/catalog?filter=new" },
    { name: "Account", path: "/dashboard" },
    ...(me?.profile?.role === "admin" ? [{ name: "Admin", path: "/admin" }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      {activePromotion && (
        <div className="bg-foreground text-background text-[10px] uppercase tracking-[0.2em] py-2">
          <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
            <span className="text-primary">Offer</span>
            <span className="text-center flex-1">
              {activePromotion.name}
              {activePromotion.description ? ` — ${activePromotion.description}` : ""}
            </span>
            <span className="text-primary">
              {activePromotion.discount_type === "percent"
                ? `${activePromotion.value}% off`
                : `₦${activePromotion.value} off`}
            </span>
          </div>
        </div>
      )}
      <nav className="container mx-auto px-6 md:px-12 py-5">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>

          {/* Logo - Vogue Editorial Style */}
          <Link to="/" className="flex-shrink-0 group">
            <h1 className="font-serif text-2xl md:text-3xl tracking-wide">
              <span className="text-primary font-light italic">Golden</span>
              <span className="text-foreground font-normal ml-2">Aura</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`relative vogue-subheading text-[10px] transition-colors duration-300 vogue-link ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary transition-colors duration-300"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} strokeWidth={1.5} />
            </Button>
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary transition-colors duration-300"
              >
                <Heart size={18} strokeWidth={1.5} />
              </Button>
            </Link>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:text-primary transition-colors duration-300"
              >
                <User size={18} strokeWidth={1.5} />
              </Button>
            </Link>
            <CartDrawer />
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="pt-5">
                <input
                  type="text"
                  placeholder="Search collections..."
                  className="w-full px-0 py-4 bg-transparent border-b border-foreground/20 focus:border-primary focus:outline-none transition-colors duration-300 font-serif text-lg italic placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden overflow-hidden"
            >
              <ul className="pt-6 pb-4 space-y-1 border-t border-border mt-5">
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-4 font-serif text-xl transition-colors duration-300 ${
                        location.pathname === link.path
                          ? "text-primary"
                          : "text-foreground/70"
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                >
                  {isAuthenticated ? (
                    <button
                      onClick={() => logout.mutate()}
                      className="block py-4 font-serif text-xl text-foreground/70 hover:text-foreground transition-colors duration-300"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-4 font-serif text-xl text-foreground/70 hover:text-foreground transition-colors duration-300"
                    >
                      Sign in
                    </Link>
                  )}
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
