import { motion } from "framer-motion";
import { clientImages } from "@/data/products";
import { Instagram } from "lucide-react";

/**
 * ClientCamSection Component - Vogue Editorial Style
 * 
 * Features:
 * - Magazine-style client showcase
 * - Editorial grid layout
 * - Elegant hover states with brand engagement
 */
const ClientCamSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20"
        >
          <div className="max-w-xl">
            <p className="vogue-subheading text-primary mb-4">
              #GoldenAuraGlow
            </p>
            <h2 className="vogue-heading text-foreground mb-4">
              Client Diaries
            </h2>
            <p className="vogue-body text-muted-foreground max-w-md">
              Our radiant community sharing their Golden Aura moments. 
              Tag us to be featured in our gallery.
            </p>
            <div className="editorial-line mt-6" />
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 md:mt-0 inline-flex items-center gap-3 vogue-subheading text-[10px] text-foreground/70 hover:text-primary transition-colors duration-300"
          >
            <Instagram size={16} strokeWidth={1.5} />
            Follow Us
          </a>
        </motion.div>

        {/* Editorial Masonry-style Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* First large image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-6 md:col-span-5 row-span-2"
          >
            <ClientImage client={clientImages[0]} variant="large" />
          </motion.div>

          {/* Second image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-6 md:col-span-4"
          >
            <ClientImage client={clientImages[1]} />
          </motion.div>

          {/* Third image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="col-span-6 md:col-span-3"
          >
            <ClientImage client={clientImages[2]} />
          </motion.div>

          {/* Fourth image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-6 md:col-span-7"
          >
            <ClientImage client={clientImages[3]} variant="wide" />
          </motion.div>
        </div>

        {/* Editorial Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <blockquote className="font-serif text-2xl md:text-3xl italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            "Jewellery is not just adornment. It is a reflection of the soul, 
            a whisper of stories untold."
          </blockquote>
          <p className="vogue-subheading text-muted-foreground mt-6">
            — Golden Aura Philosophy
          </p>
        </motion.div>
      </div>
    </section>
  );
};

interface ClientImageProps {
  client: {
    id: string;
    image: string;
    name: string;
    product: string;
  };
  variant?: "default" | "large" | "wide";
}

const ClientImage = ({ client, variant = "default" }: ClientImageProps) => {
  const aspectClass = variant === "large" 
    ? "aspect-[3/4]" 
    : variant === "wide" 
    ? "aspect-[16/9]" 
    : "aspect-square";

  return (
    <div className={`group relative ${aspectClass} overflow-hidden cursor-pointer`}>
      <img
        src={client.image}
        alt={`${client.name} wearing ${client.product}`}
        className="w-full h-full object-cover editorial-image transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Elegant Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
        <p className="font-serif text-lg text-background italic">{client.name}</p>
        <p className="vogue-subheading text-background/70 text-[9px] mt-1">{client.product}</p>
      </div>

      {/* Gold Border on Hover */}
      <div className="absolute inset-0 border border-transparent group-hover:border-primary/50 transition-colors duration-500" />
    </div>
  );
};

export default ClientCamSection;
