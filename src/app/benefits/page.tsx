import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Benefits of Organic Goat Manure",
  description: "Learn why ADHYANTHA organic goat manure improves soil health and supports stronger, healthier plants.",
};

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

  const review =
    testimonial?.review ??
    "My tomato plants have never looked better. Switched from chemical fertilizer three months ago and the difference in soil texture alone is remarkable.";

  const customerName = testimonial?.customerName ?? "Ramesh K.";
  const customerLocation = testimonial?.location ?? "Coimbatore, TN";

  return (
    <main className="bg-[var(--color-parchment)] text-[var(--color-ink)]">
      <section className="container-page">
        <div className="relative overflow-hidden rounded-b-[26px] shadow-[0_20px_40px_rgba(31,44,16,0.08)]">
          <div className="relative h-[320px] sm:h-[360px] lg:h-[390px]">
            <Image
              src="/images/01-hero-gardening-soil.png"
              alt="Gardener planting a seedling in rich organic soil"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,24,14,0.72),rgba(18,24,14,0.38),rgba(18,24,14,0.12))]" />

            <div className="relative z-10 flex h-full items-center">
              <div className="max-w-[600px] px-5 py-8 sm:px-8 lg:px-10">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-parchment)]/85">
                  WHY ORGANIC MATTERS
                </p>
                <h1 className="max-w-[560px] font-display text-[clamp(2.6rem,4vw,4rem)] leading-[0.9] tracking-[-0.06em] text-white">
                  UNLEASH YOUR GARDEN&apos;S
                  <br />
                  POTENTIAL, NATURALLY.
                </h1>
                <p className="mt-4 max-w-[540px] text-sm leading-relaxed text-white/80 sm:text-[15px] lg:text-base">
                  Organic goat manure fertilizer enriches the soil with balanced nutrients, improves soil health,
                  and helps your garden thrive naturally.
                </p>
                <Link
                  href="#benefits"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-canopy-dark)] transition-colors hover:bg-white"
                >
                  EXPLORE THE BENEFITS <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="container-page py-12 sm:py-14 lg:py-16">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-[20px] border border-[var(--color-border)] bg-white p-5 shadow-[0_10px_24px_rgba(42,42,34,0.04)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex h-[140px] items-center justify-center overflow-hidden rounded-[18px] bg-[var(--color-parchment)] p-3">
                <Image
                  src={benefit.image}
                  alt={benefit.alt}
                  width={240}
                  height={120}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="mt-4 text-[1.35rem] font-semibold uppercase leading-tight tracking-[-0.05em] text-[var(--color-canopy)]">
                {benefit.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-stone)]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page pb-12 pt-2 sm:pb-14 lg:pb-16">
        <div className="grid items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[0_10px_24px_rgba(42,42,34,0.04)]">
            <Image
              src="/images/03-gardener-testimonial.png"
              alt="Organic gardener working in a vegetable garden"
              width={600}
              height={420}
              loading="lazy"
              className="h-[320px] w-full object-cover sm:h-[350px] lg:h-full"
            />
          </div>

          <div className="rounded-[22px] bg-[var(--color-canopy-dark)] p-6 text-white shadow-[0_12px_28px_rgba(18,24,14,0.12)] sm:p-7 lg:p-8">
            <div className="flex h-full flex-col justify-between">
              <div className="text-[4.5rem] leading-none text-white/15 font-display">“</div>
              <blockquote className="mt-[-0.3rem] text-[clamp(1.5rem,2vw,2.2rem)] font-display leading-[1.08] tracking-[-0.05em] text-[var(--color-parchment)]">
                {review}
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-parchment)]">
                  {customerName.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{customerName}</p>
                  <p className="text-sm text-white/75">{customerLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
