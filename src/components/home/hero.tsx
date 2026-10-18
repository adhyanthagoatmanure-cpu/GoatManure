import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafMotif } from "@/components/brand/product-bag-illustration";

export function Hero() {
  return (
    <>
      <section className="relative aspect-[8/3] min-h-0 overflow-hidden border-b border-[var(--color-border)] bg-[#18230f] sm:min-h-[220px]">
        <div className="home-hero-bg">
          <Image
            src="/images/home-garden-bg.png"
            alt="A gardener holding organic goat manure in a thriving garden"
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>
        <LeafMotif className="pointer-events-none absolute -left-6 -top-6 z-10 h-24 w-24 sm:h-56 sm:w-56" />
        <div className="container-page absolute inset-x-0 bottom-0 z-10 flex h-full justify-center pb-3 text-center sm:relative sm:py-8 sm:pb-0 lg:py-20">
          <div className="flex max-w-2xl flex-col items-center justify-end sm:justify-center">
            <div className="mt-2 flex w-full max-w-[17rem] items-center justify-center gap-2 sm:mt-8 sm:w-auto sm:max-w-none sm:gap-3">
              <Link href="/products" className="flex-none sm:flex-initial">
                <Button size="md" className="!h-9 w-[6.5rem] gap-1 rounded-lg px-1.5 text-[10px] sm:!h-13 sm:w-auto sm:gap-2 sm:rounded-[var(--radius-md)] sm:px-7 sm:text-base">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/benefits" className="flex-none sm:flex-initial">
                <Button
                  size="md"
                  variant="ghost"
                  className="!h-9 w-[6.5rem] gap-1 rounded-lg border border-black bg-white !px-1.5 text-[10px] !text-black shadow-md hover:bg-white/90 sm:!h-13 sm:w-auto sm:gap-2 sm:rounded-[var(--radius-md)] sm:!px-7 sm:text-base"
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
