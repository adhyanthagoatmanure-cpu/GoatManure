import { Sprout, Droplets, Leaf, Mountain } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

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
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why ADHYANTHA"
          title="Fertilizer your soil will thank you for"
          description="Every batch is sourced, sun-dried, and processed to keep it exactly what it should be — natural."
        />
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <div key={item.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-canopy)]/10">
                <item.icon className="h-5.5 w-5.5 text-[var(--color-canopy)]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-medium">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-stone)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
