import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sprout } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, cssVars } from "@/components/ui/reveal";

/**
 * Brand introduction. Every statement here is taken from copy the site already
 * carries (footer, benefits, product panel, metadata) — nothing new is claimed.
 */
export function BrandStory() {
  return (
    <section className="py-14 sm:py-24 lg:py-28">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Reveal>
          <div className="relative isolate aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-lifted)] sm:aspect-[16/11]">
            {/* oversized layer travels inside the clipped frame (desktop only) */}
            <div aria-hidden className="parallax absolute inset-x-0 -inset-y-[12%]" style={cssVars({ "--px": "8%" })}>
              <Image
                src="/images/home/story-garden.webp"
                alt=""
                fill
                sizes="(min-width: 1024px) 52vw, 92vw"
                className="object-cover"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[rgba(20,38,14,0.55)] via-transparent to-transparent"
            />
            <p
              data-on-dark
              className="glass-dark absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white sm:right-auto"
            >
              <Sprout className="h-5 w-5 shrink-0 text-[#cfe7b4]" aria-hidden />
              Sourced, sun-dried and processed
            </p>
          </div>
        </Reveal>

        <Reveal index={1}>
          <SectionHeading
            eyebrow="About ADHYANTHA"
            title="Simple, natural nutrition for your soil"
            description="ADHYANTHA brings you 100% organic goat manure fertilizer, sourced and processed for the modern Indian gardener and farmer. Every batch is sun-dried and processed to stay exactly what it should be — natural, with no synthetic chemicals."
          />
          <ul className="mt-7 space-y-3 text-[15px] font-medium text-[var(--color-ink)]">
            {["100% organic, chemical-free", "Sun-dried and processed", "Sustainably packed and delivered across India"].map(
              (point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-canopy)] text-white">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {point}
                </li>
              )
            )}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/benefits"
              className="group inline-flex items-center gap-2 font-semibold text-[var(--color-canopy)] hover:underline"
            >
              Explore the benefits{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link href="/contact" className="font-semibold text-[var(--color-stone)] hover:text-[var(--color-canopy)] hover:underline">
              Contact us
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
