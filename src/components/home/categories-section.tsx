import Link from "next/link";
import { ArrowUpRight, Sprout } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCategoriesWithProductCount } from "@/server/services/product.service";

/** Real categories from the database (only those that currently hold active products). */
export async function CategoriesSection() {
  const categories = (await getCategoriesWithProductCount())
    .filter((category) => category._count.products > 0)
    .slice(0, 8);
  if (categories.length === 0) return null;

  return (
    <section className="py-6 sm:py-10">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Shop by Category"
            title="Find what your soil needs"
            description="Browse our range by category."
          />
        </Reveal>
        <div className="mt-9 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
          {categories.map((category, i) => (
            <Reveal key={category.id} index={i} className="h-full">
              <Link
                href={`/products?category=${encodeURIComponent(category.slug)}`}
                className="glass-tint glass-lift group flex h-full items-start gap-4 rounded-[var(--radius-lg)] p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--color-canopy)] shadow-[var(--shadow-soft)]">
                  <Sprout className="h-6 w-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg font-medium text-[var(--color-ink)]">{category.name}</span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[var(--color-canopy)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  {category.description && (
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-[var(--color-stone)]">
                      {category.description}
                    </span>
                  )}
                  <span className="mt-2 block text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-bronze-dark)]">
                    {category._count.products} {category._count.products === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
