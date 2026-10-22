import { Sprout, Droplets, Leaf, Mountain } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, cssVars } from "@/components/ui/reveal";

const ITEMS = [
  {
    icon: Sprout,
    title: "Nutrient Rich",
    description: "Packed with the N-P-K and micronutrients plants need for healthy, steady growth.",
  },
  {
    icon: Mountain,
    title: "Improves Soil Health",
    description: "Builds soil structure over time, so it stays loose, fertile, and easy to work.",
  },
  {
    icon: Leaf,
    title: "100% Natural",
    description: "No synthetic chemicals — just sun-dried, processed goat manure, exactly as nature made it.",
  },
  {
    icon: Droplets,
    title: "Water Retention",
    description: "Helps soil hold moisture longer, so your plants need less frequent watering.",
  },
];

export function WhyUs() {
  return (
    <section className="relative isolate overflow-hidden py-14 sm:py-24 lg:py-28">
      {/* Colour fields for the glass cards to blur; they drift gently as you scroll (desktop only). */}
      <div
        aria-hidden
        className="parallax pointer-events-none absolute inset-x-0 -inset-y-[12%] -z-10"
        style={cssVars({ "--px": "7%" })}
      >
        <div className="absolute -left-[6%] top-[10%] h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(116,168,80,0.38),transparent)]" />
        <div className="absolute -right-[5%] top-[42%] h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.24),transparent)]" />
      </div>

      <div className="container-page">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Why ADHYANTHA"
            title="Fertilizer your soil will thank you for"
            description="Every batch is sourced, sun-dried, and processed to keep it exactly what it should be — natural."
          />
        </Reveal>
        <div className="mt-9 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} index={i} className="h-full">
              {/* phones: icon beside the text to keep the stack short; larger screens: stacked */}
              <div className="glass glass-lift flex h-full gap-4 rounded-[var(--radius-lg)] p-5 sm:block sm:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-sage-deep)] to-[var(--color-sage)] text-[var(--color-canopy)]">
                  <item.icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-medium sm:mt-5">{item.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-stone)] sm:mt-2">{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
