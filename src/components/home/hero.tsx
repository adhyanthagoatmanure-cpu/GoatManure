import Link from "next/link";
import { ArrowRight, Truck, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <>
      <section className="home-hero relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="home-hero-bg" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[2048px] items-end justify-center px-4 pb-8 sm:pb-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/products">
              <Button size="lg" className="rounded-full bg-[var(--color-canopy)] px-7 text-base font-semibold text-white hover:bg-[var(--color-canopy)]/90">
                SHOP PRODUCTS <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/benefits">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full border border-[rgba(27,31,24,0.7)] bg-white/20 px-7 text-base font-semibold text-[var(--color-ink)] shadow-md backdrop-blur-sm hover:bg-white/30"
              >
                LEARN MORE
              </Button>
            </Link>
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
