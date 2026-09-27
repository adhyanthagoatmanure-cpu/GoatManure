import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/server/services/product.service";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4);
  if (products.length === 0) return null;

  return (
    <section className="bg-[var(--color-parchment-deep)]/35 py-16 sm:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Our Products"
            title="Featured Products"
            description="Our flagship organic goat manure, available in five sizes to fit any garden."
          />
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-canopy)] hover:underline"
          >
            View all products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
