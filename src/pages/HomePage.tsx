import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { OfferMarquee } from '@/components/home/OfferMarquee';
import { MenuGallery } from '@/components/home/MenuGallery';
import { StatsBar } from '@/components/home/StatsBar';
import { AboutStrip } from '@/components/home/AboutStrip';
import { ContactSection } from '@/components/home/ContactSection';

export default function HomePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-brand-charcoal flex flex-col"
    >
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <OfferMarquee />
        <MenuGallery />
        <StatsBar />
        <AboutStrip />
        <ContactSection />
      </main>
      <Footer />
    </motion.div>
  );
}