import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { TestimonialCard } from "@/components/testimonial/testimonial-card";
import { prisma } from "@/lib/prisma";

export async function TestimonialsSection() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
  if (testimonials.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Testimonials"
            title="What gardeners are saying"
            description="Real feedback matters to us — these placeholders will be replaced with genuine customer reviews at launch."
          />
          <Link href="/testimonials" className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-canopy)] hover:underline">
            Read all reviews <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
