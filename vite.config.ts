import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { 
      overlay: false,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "https://goldenaura.tech",
        changeOrigin: true,
      },
      "/assets": {
        target: process.env.VITE_BACKEND_URL || "https://goldenaura.tech",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      threshold: 1024,
    }),
    // Brotli compression
    viteCompression({
      algorithm: "brotliCompress",
      threshold: 1024,
      ext: ".br",
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsDir: "_assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
          ],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          charts: ["recharts"],
        },
      },
    },
  },
}));
