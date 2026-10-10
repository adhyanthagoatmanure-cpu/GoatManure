import Link from "next/link";
import { ArrowRight, Truck, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafMotif } from "@/components/brand/product-bag-illustration";

export function Hero() {
  return (
    <>
      <section className="home-hero-banner border-b border-[var(--color-border)]">
      <div className="home-hero-bg" aria-hidden="true" />
      <LeafMotif className="pointer-events-none absolute -left-6 -top-6 z-10 h-40 w-40 sm:h-56 sm:w-56" />
      <div className="home-hero-actions">
        <Link href="/products">
          <Button size="md" className="sm:h-13 sm:px-7 sm:text-base">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/benefits">
          <Button
            size="md"
            variant="ghost"
            className="border border-black bg-white !text-black shadow-md hover:bg-white/90 sm:h-13 sm:px-7 sm:text-base"
          >
            Learn how it works
          </Button>
        </Link>
        </div>
      </section>
      <div className="container-page flex flex-wrap justify-center gap-x-7 gap-y-3 py-6 text-sm text-[var(--color-ink)]">
        <span className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-[var(--color-canopy)]" /> 100% Organic
        </span>
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[var(--color-canopy)]" /> Pan-India Delivery
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--color-canopy)]" /> Cash on Delivery Available
        </span>
      </div>
    </>
  );
}
