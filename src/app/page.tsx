import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { WhyUs } from "@/components/home/why-us";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandStory } from "@/components/home/brand-story";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { BlogSection } from "@/components/home/blog-section";
import { CtaBanner } from "@/components/home/cta-banner";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyUs />
      <CategoriesSection />
      <FeaturedProducts />
      <BrandStory />
      <TestimonialsSection />
      <BlogSection />
      <CtaBanner />
    </>
  );
}
