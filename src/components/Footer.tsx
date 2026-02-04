import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";
import type { ApiCategory } from "@/lib/types";

/**
 * Footer Component - Vogue Editorial Style
 * 
 * Features:
 * - Refined editorial layout
 * - Elegant serif branding
 * - Sophisticated link styling
 */
const Footer = () => {
  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ApiCategory[]>("/categories/"),
  });
  const collectionLinks = categories.length
    ? categories.slice(0, 4).map((category) => ({
        label: category.name,
        href: `/catalog?category=${category.id}`,
      }))
    : ["Rings", "Necklaces", "Earrings", "Bracelets"].map((item) => ({
        label: item,
        href: "/catalog",
      }));

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-6 md:px-12 py-20 md:py-24">
        <div className="grid grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="col-span-12 md:col-span-4 lg:col-span-5">
            <Link to="/" className="inline-block mb-6">
              <h2 className="font-serif text-3xl md:text-4xl tracking-wide">
                <span className="text-primary italic">Golden</span>
                <span className="text-background ml-2">Aura</span>
              </h2>
            </Link>
            <p className="vogue-body text-background/60 leading-relaxed mb-8 max-w-sm">
              Crafting timeless elegance since 2010. Each piece tells a story of 
              exceptional craftsmanship and enduring beauty.
            </p>
            <div className="flex gap-5">
              <a href="#" className="text-background/50 hover:text-primary transition-colors duration-300">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-background/50 hover:text-primary transition-colors duration-300">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-background/50 hover:text-primary transition-colors duration-300">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-6 md:col-span-2 lg:col-span-2">
            <h3 className="vogue-subheading text-[10px] text-background mb-6">Collections</h3>
            <ul className="space-y-4">
              {collectionLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="vogue-body text-background/60 hover:text-primary transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2 lg:col-span-2">
            <h3 className="vogue-subheading text-[10px] text-background mb-6">Customer Care</h3>
            <ul className="space-y-4">
              {["Contact Us", "Shipping", "Returns", "Size Guide"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="vogue-body text-background/60 hover:text-primary transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <h3 className="vogue-subheading text-[10px] text-background mb-6">Newsletter</h3>
            <p className="vogue-body text-background/60 mb-6">
              Subscribe for exclusive previews and private sale access.
            </p>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-0 py-3 bg-transparent border-b border-background/30 focus:border-primary focus:outline-none transition-colors duration-300 vogue-body text-background placeholder:text-background/40"
              />
              <button
                type="submit"
                className="w-full py-4 bg-primary text-primary-foreground vogue-subheading text-[10px] hover:bg-primary/90 transition-colors duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="vogue-subheading text-[9px] text-background/40">
            © 2024 Golden Aura Jewellery. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="vogue-subheading text-[9px] text-background/40 hover:text-primary transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="#" className="vogue-subheading text-[9px] text-background/40 hover:text-primary transition-colors duration-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
