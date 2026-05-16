import Hero from "@/components/landing/Hero";
import AboutSection from "@/components/landing/AboutSection";
import FeaturedSection from "@/components/landing/FeaturedSection";
import PhilosophySection from "@/components/landing/PhilosophySection";
import ServicesSection from "@/components/landing/ServicesSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";

export default async function Home() {
  return (
    <main style={{ background: "#000" }}>
      <Hero />
      <AboutSection />
      <FeaturedSection />
      <PhilosophySection />
      <ServicesSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
