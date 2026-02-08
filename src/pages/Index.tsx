import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CollectionBanner from "@/components/CollectionBanner";
import ClientCamSection from "@/components/ClientCamSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <CollectionBanner />
        <FeaturedProducts />
        <ClientCamSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
