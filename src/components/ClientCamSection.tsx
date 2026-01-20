import { motion } from "framer-motion";
import { clientImages } from "@/data/products";

const ClientCamSection = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.2em] uppercase mb-3">
            #GoldenAuraGlow
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Client Cam
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Our radiant clients sharing their Golden Aura moments. 
            Tag us to be featured.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {clientImages.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative aspect-square overflow-hidden rounded-sm cursor-pointer"
            >
              <img
                src={client.image}
                alt={`${client.name} wearing ${client.product}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-cream font-medium text-sm">{client.name}</p>
                <p className="text-cream/70 text-xs">{client.product}</p>
              </div>

              {/* Gold Border on Hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold transition-colors duration-300 rounded-sm" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientCamSection;
