import Image from "next/image";
import { ArrowRight, Leaf, Truck, ShieldCheck, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cssVars } from "@/components/ui/reveal";
import { SHIPPING_CONFIG } from "@/lib/config";
import { formatINR } from "@/lib/utils";

/**
 * Hero: three depth layers.
 *  1. Pre-blurred garden backdrop (tiny file) that drifts slower than the page.
 *  2. Product/brand photograph in a frosted frame, drifting a touch faster.
 *  3. Frosted floating info cards that sit over the photograph.
 * Parallax is CSS scroll-driven, disabled below 768px and for reduced-motion users.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="parallax-exit absolute inset-0 -z-20" style={cssVars({ "--px": "16%" })}>
        <Image
          src="/images/home/hero-backdrop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* legibility wash: keeps headline contrast high regardless of what is in the photo */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(247,245,238,0.95)_0%,rgba(247,245,238,0.84)_40%,rgba(247,245,238,0.5)_72%,rgba(247,245,238,0.26)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-b from-transparent to-[var(--color-canvas)]"
      />

      <div className="container-page grid items-center gap-10 pb-20 pt-10 sm:pb-24 sm:pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:pb-32 lg:pt-20">
        <div className="max-w-xl">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-canopy)]">
            <Leaf className="h-3.5 w-3.5" aria-hidden /> 100% organic goat manure
          </p>
          <h1 className="mt-5 text-balance font-display text-[2.6rem] font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            Nourish Your Soil.
            <span className="block font-semibold italic text-[var(--color-leaf)]">Grow Naturally.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--color-stone)]">
            Discover quality organic goat manure to support your gardening, farming, and soil-care needs.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href="/products" size="lg" className="w-full rounded-full px-8 sm:w-auto">
              Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="#featured-products" size="lg" variant="glass" className="w-full rounded-full px-8 sm:w-auto">
              Explore Products
            </ButtonLink>
          </div>

          <ul className="mt-9 flex flex-wrap gap-2.5 text-sm font-semibold text-[var(--color-ink)]">
            <li className="glass flex items-center gap-2 rounded-full px-3.5 py-2">
              <Leaf className="h-4 w-4 text-[var(--color-leaf)]" aria-hidden /> 100% Organic
            </li>
            <li className="glass flex items-center gap-2 rounded-full px-3.5 py-2">
              <Truck className="h-4 w-4 text-[var(--color-leaf)]" aria-hidden /> Pan-India Delivery
            </li>
            <li className="glass flex items-center gap-2 rounded-full px-3.5 py-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-leaf)]" aria-hidden /> Cash on Delivery Available
            </li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
          <div className="parallax-exit" style={cssVars({ "--px": "6%" })}>
            <div className="glass-strong rounded-[var(--radius-xl)] p-2 sm:p-2.5">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[calc(var(--radius-xl)-10px)] bg-[var(--color-sage)] sm:aspect-[6/5]">
                <Image
                  src="/images/home/hero-bags.webp"
                  alt="A gardener holding organic goat manure in a thriving garden"
                  fill
                  priority
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 544px, 92vw"
                  className="object-cover object-[55%_center]"
                />
              </div>
            </div>
          </div>

          {/* floating cards sit on the frame's edges so they never cover the brand label on the bags */}
          <div className="glass absolute -bottom-5 -right-2 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex lg:-right-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-sage)] text-[var(--color-canopy)]">
              <Truck className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm leading-tight">
              <span className="block font-bold text-[var(--color-ink)]">
                Free shipping above {formatINR(SHIPPING_CONFIG.freeAboveSubtotal)}
              </span>
              <span className="text-xs text-[var(--color-stone)]">Delivered across India</span>
            </p>
          </div>
          <div className="glass absolute -left-2 top-8 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex lg:-left-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-sage)] text-[var(--color-canopy)]">
              <Sprout className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm leading-tight">
              <span className="block font-bold text-[var(--color-ink)]">Sun-dried &amp; processed</span>
              <span className="text-xs text-[var(--color-stone)]">No synthetic chemicals</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
