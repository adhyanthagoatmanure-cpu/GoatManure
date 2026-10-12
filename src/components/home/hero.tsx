import Link from "next/link";
import { ArrowRight, Truck, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafMotif } from "@/components/brand/product-bag-illustration";

export function Hero() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <div className="home-hero-bg" aria-hidden="true" />
      <LeafMotif className="pointer-events-none absolute -left-6 -top-6 z-10 h-40 w-40 sm:h-56 sm:w-56" />
      <div className="container-page relative z-10 flex justify-center py-14 text-center sm:py-20 lg:py-20">
        <div className="flex max-w-2xl flex-col items-center">
          
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/products">
              <Button size="lg">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/benefits">
              <Button
                size="lg"
                variant="ghost"
                className="border border-black bg-white !text-black shadow-md hover:bg-white/90"
              >
                Learn how it works
              </Button>
            </Link>
          </div>

        </div>
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
