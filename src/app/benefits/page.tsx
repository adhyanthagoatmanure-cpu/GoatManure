import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, cssVars } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Benefits of Organic Goat Manure",
  description: "Learn why ADHYANTHA organic goat manure improves soil health and supports stronger, healthier plants.",
};

export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    title: "SUPERCHARGE GROWTH",
    description: "Packed with essential N-P-K for nutrient-rich soil that supports healthy growth, flowering, and fruit production.",
    image: "/images/05-benefit-growth.png",
    alt: "Healthy plant growing upward with leaves and a growth arrow",
  },
  {
    title: "REVITALIZE SOIL",
    description: "Improves soil organic matter and supports beneficial microorganisms, helping create better soil structure, aeration, and drainage.",
    image: "/images/06-benefit-soil.png",
    alt: "Soil cross-section with roots, microorganisms, and organic matter",
  },
  {
    title: "OPTIMIZE WATER USE",
    description: "Improves soil water-retention capacity, helping plants access moisture and reducing unnecessary watering.",
    image: "/images/07-benefit-water.png",
    alt: "Soil layers with water droplets and roots for moisture retention",
  },
  {
    title: "SUSTAINABLE FERTILIZER",
    description: "A renewable organic fertilizer source that turns natural waste into valuable nutrients for healthier soil and plants.",
    image: "/images/08-benefit-sustainable.png",
    alt: "Goat and circular arrows showing a sustainable fertilizer cycle",
  },
  {
    title: "BOOST PLANT HEALTH",
    description: "Supports strong, healthy plants by improving soil fertility and creating a better environment for root development.",
    image: "/images/09-benefit-plant-health.png",
    alt: "Healthy plant protected in a shield symbol",
  },
  {
    title: "SLOW-RELEASE NUTRIENTS",
    description: "Provides nutrients gradually over time, supporting consistent plant growth and reducing the need for frequent applications.",
    image: "/images/10-benefit-slow-release.png",
    alt: "Clock and soil illustration showing slow-release nutrients",
  },
];

export default async function BenefitsPage() {
  const testimonial = await prisma.testimonial.findFirst({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  // The page's <main> landmark comes from SiteChrome, so this is a plain wrapper.
  return (
    <div className="text-ink">
      {/* Hero: photo with a gentle parallax drift (desktop, motion-OK only) and the message on a frosted dark panel. */}
      <section className="container-page pt-6 sm:pt-8">
        <div className="relative isolate overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--glass-shadow)]">
          <div className="relative flex min-h-[420px] items-end sm:min-h-[460px] sm:items-center lg:min-h-[500px]">
            <div
              className="parallax absolute inset-x-0 -inset-y-[12%] -z-20"
              style={cssVars({ "--px": "8%" })}
            >
              <Image
                src="/images/01-hero-gardening-soil.png"
                alt="Gardener planting a seedling in rich organic soil"
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="object-cover object-[68%_center] sm:object-center"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(28,51,20,0.5),rgba(28,51,20,0.08)_70%)]"
            />

            <div className="w-full p-4 sm:p-8 lg:p-12">
              <div data-on-dark className="glass-dark max-w-[36rem] rounded-[var(--radius-lg)] p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-deep">WHY ORGANIC MATTERS</p>
                <h1 className="mt-3 font-display text-[clamp(1.9rem,6.5vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-white">
                  UNLEASH YOUR GARDEN&apos;S
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  POTENTIAL, NATURALLY.
                </h1>
                <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-white/90">
                  Organic goat manure fertilizer enriches the soil with balanced nutrients, improves soil health,
                  and helps your garden thrive naturally.
                </p>
                <ButtonLink href="#benefits" variant="glass" size="md" className="mt-6 rounded-full px-6">
                  Explore the Benefits <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-header relative isolate overflow-hidden py-12 sm:py-16 lg:py-20">
        {/* Soft colour fields behind the frosted cards. */}
        <div
          aria-hidden
          className="parallax pointer-events-none absolute inset-x-0 -inset-y-[12%] -z-10"
          style={cssVars({ "--px": "7%" })}
        >
          <div className="absolute -left-[6%] top-[8%] h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(116,168,80,0.34),transparent)]" />
          <div className="absolute -right-[5%] top-[46%] h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.22),transparent)]" />
        </div>

        <div className="container-page">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <Reveal key={benefit.title} index={i % 3} className="h-full">
                <article className="glass glass-lift h-full rounded-[var(--radius-lg)] p-4 sm:p-5">
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-white/70 p-2 sm:h-[150px] sm:p-3">
                    <Image
                      src={benefit.image}
                      alt={benefit.alt}
                      width={240}
                      height={120}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold uppercase leading-tight tracking-[-0.01em] text-canopy sm:text-[1.35rem]">
                    {benefit.title}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-stone">{benefit.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-14 pt-2 sm:pb-20">
        <div className="grid items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="h-full">
            <div className="surface h-full overflow-hidden rounded-[var(--radius-lg)]">
              <Image
                src="/images/03-gardener-testimonial.png"
                alt="Organic gardener working in a vegetable garden"
                width={600}
                height={420}
                loading="lazy"
                className="h-[320px] w-full object-cover sm:h-[350px] lg:h-full"
              />
            </div>
          </Reveal>

          <Reveal index={1} className="h-full">
            <div
              data-on-dark
              className="flex h-full flex-col justify-between rounded-[var(--radius-lg)] bg-[linear-gradient(160deg,var(--color-canopy-dark),var(--color-canopy))] p-6 text-white shadow-[var(--glass-shadow)] sm:p-8"
            >
              {testimonial ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div aria-hidden className="font-display text-[4.5rem] leading-none text-white/20">“</div>
                    {testimonial.isDemo && (
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30">
                        Demo review
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-[-0.3rem] font-display text-[clamp(1.5rem,2vw,2.2rem)] leading-[1.15] tracking-[-0.02em] text-parchment">
                    {testimonial.review}
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sm font-bold uppercase text-parchment"
                    >
                      {testimonial.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{testimonial.customerName}</p>
                      {testimonial.location && <p className="text-sm text-white/80">{testimonial.location}</p>}
                    </div>
                  </div>
                </>
              ) : (
                // No published testimonial yet: show an honest call to action rather than an invented quote.
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-deep">Ready to start?</p>
                    <h2 className="mt-3 font-display text-[clamp(1.6rem,2.4vw,2.4rem)] font-semibold leading-[1.1] text-white">
                      Give your soil something natural.
                    </h2>
                    <p className="mt-3 max-w-md text-base leading-relaxed text-white/90">
                      Explore ADHYANTHA organic goat manure and choose the pack size that suits your garden.
                    </p>
                  </div>
                  <div className="mt-8">
                    <ButtonLink href="/products" variant="glass" size="lg" className="rounded-full px-8">
                      Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
                    </ButtonLink>
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
