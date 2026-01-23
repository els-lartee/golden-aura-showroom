import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Navbar Component - Swiss Design Style
 * 
 * Features:
 * - Clean horizontal lines
 * - Bold uppercase typography
 * - Minimal ornamentation
 * - High contrast
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/catalog" },
    { name: "New", path: "/catalog?filter=new" },
    { name: "Account", path: "/dashboard" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-foreground">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
          </button>

          {/* Logo - Swiss Bold */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
              <span className="text-primary">Golden</span>
              <span className="text-foreground ml-1">Aura</span>
            </h1>
          </Link>

          {/* Desktop Navigation - Swiss Style */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`relative text-xs font-bold tracking-[0.15em] uppercase transition-colors hover:text-primary ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={20} strokeWidth={2} />
            </Button>
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary transition-colors"
              >
                <Heart size={20} strokeWidth={2} />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:text-primary transition-colors"
              >
                <User size={20} strokeWidth={2} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:text-primary transition-colors"
            >
              <ShoppingBag size={20} strokeWidth={2} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                0
              </span>
            </Button>
          </div>
        </div>

        {/* Search Bar - Swiss Minimal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-3 bg-secondary border-2 border-foreground focus:outline-none focus:border-primary transition-colors text-sm font-medium tracking-wide"
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
              className="lg:hidden overflow-hidden"
            >
              <ul className="pt-4 pb-2 space-y-1 border-t-2 border-foreground mt-4">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-3 text-xs font-bold tracking-[0.15em] uppercase transition-colors ${
                        location.pathname === link.path
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;

