import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  selectedIndex: number;
  onSelectImage: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  productTitle: string;
};

const ProductGallery = ({
  images,
  selectedIndex,
  onSelectImage,
  onNext,
  onPrev,
  productTitle,
}: ProductGalleryProps) => (
  <m.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-4"
  >
    <div className="relative aspect-square bg-secondary overflow-hidden">
      <AnimatePresence mode="wait">
        <m.img
          key={selectedIndex}
          src={images[selectedIndex]}
          alt={productTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background hover:bg-secondary transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-4 left-4 px-3 py-1 bg-background text-xs font-bold tracking-wide">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>

    <div className="flex gap-2">
      {images.map((image, index) => (
        <button
          key={index}
          onClick={() => onSelectImage(index)}
          className={`relative w-20 h-20 overflow-hidden transition-all ${
            selectedIndex === index
              ? "ring-2 ring-foreground"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <img
            src={image}
            alt={`${productTitle} view ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  </m.div>
);

export default ProductGallery;
