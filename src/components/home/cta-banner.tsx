import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, cssVars } from "@/components/ui/reveal";
import { SHIPPING_CONFIG } from "@/lib/config";
import { formatINR } from "@/lib/utils";

export function CtaBanner() {
  return (
    <section className="container-page pb-4">
      <Reveal>
        <div
          data-on-dark
          className="relative isolate overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-canopy-dark)] px-5 py-14 text-center shadow-[var(--shadow-lifted)] sm:px-12 sm:py-20"
        >
          <div aria-hidden className="parallax absolute inset-x-0 -inset-y-[12%] -z-10" style={cssVars({ "--px": "8%" })}>
            <Image
              src="/images/home/cta-soil.webp"
              alt=""
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
          <div aria-hidden className="absolute inset-0 -z-10 bg-[rgba(20,38,14,0.4)]" />

          <div className="glass-dark mx-auto max-w-2xl rounded-[var(--radius-lg)] px-6 py-9 sm:px-10 sm:py-11">
            <h2 className="text-balance font-display text-3xl font-medium !text-white sm:text-4xl">
              Ready to give your garden the natural boost it deserves?
            </h2>
            <p className="mx-auto mt-3.5 max-w-md text-[15px] leading-relaxed text-white/90">
              Free shipping on orders above {formatINR(SHIPPING_CONFIG.freeAboveSubtotal)}. Cash on Delivery available
              across India.
            </p>
            <ButtonLink
              href="/products"
              size="lg"
              className="mt-7 rounded-full bg-white px-8 !text-[var(--color-canopy-dark)] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] hover:bg-[var(--color-sage)]"
            >
              Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
