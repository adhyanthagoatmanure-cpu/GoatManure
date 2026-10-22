import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/server/services/product.service";

/** Keep the grid balanced when fewer than four products are featured. */
function gridClass(count: number) {
  if (count >= 4) return "grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "grid-cols-2 lg:grid-cols-3";
  if (count === 2) return "mx-auto max-w-3xl grid-cols-2";
  return "mx-auto max-w-xs grid-cols-1";
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4);
  if (products.length === 0) return null;

  return (
    <section
      id="featured-products"
      className="scroll-mt-header mt-10 bg-[linear-gradient(180deg,rgba(232,238,220,0.7)_0%,rgba(232,238,220,0.25)_100%)] py-14 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Our Products"
              title="Featured Products"
              description="Our flagship organic goat manure, available in five sizes to fit any garden."
            />
            <Link
              href="/products"
              className="group flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-canopy)] transition-colors hover:bg-white"
            >
              View all products{" "}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className={`mt-9 grid gap-4 sm:mt-12 sm:gap-6 ${gridClass(products.length)}`}>
          {products.map((product, i) => (
            <Reveal key={product.id} index={i} className="h-full">
              <ProductCard product={product} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
