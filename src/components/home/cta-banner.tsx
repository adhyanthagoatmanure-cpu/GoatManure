import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafMotif } from "@/components/brand/product-bag-illustration";

export function CtaBanner() {
  return (
    <section className="container-page pb-20 sm:pb-28">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-canopy)] px-8 py-14 text-center sm:px-16 sm:py-20">
        <LeafMotif className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 opacity-20" color="#fff" />
        <LeafMotif className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rotate-180 opacity-20" color="#fff" />
        <h2 className="text-balance mx-auto max-w-xl font-display text-3xl font-medium text-white sm:text-4xl">
          Ready to give your garden the natural boost it deserves?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-white/80">
          Free shipping on orders above ₹499. Cash on Delivery available across India.
        </p>
        <Link href="/products" className="mt-7 inline-block">
          <Button size="lg" className="bg-white !text-[var(--color-bronze)] hover:bg-white/90">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
