import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { Navbar } from '@/components/landing/navbar';
import { Pricing } from '@/components/landing/pricing';
import { ProductShowcase } from '@/components/landing/product-showcase';
import { Testimonials } from '@/components/landing/testimonials';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
      <ProductShowcase />
      <Pricing />
      <Testimonials />
      <Footer />
    </main>
  );
}
