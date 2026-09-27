import { Hero } from "@/components/home/hero";
import { WhyUs } from "@/components/home/why-us";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { BlogSection } from "@/components/home/blog-section";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyUs />
      <FeaturedProducts />
      <TestimonialsSection />
      <BlogSection />
      <CtaBanner />
    </>
  );
}
