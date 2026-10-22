import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { TestimonialCard } from "@/components/testimonial/testimonial-card";
import { prisma } from "@/lib/prisma";

export async function TestimonialsSection() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
  if (testimonials.length === 0) return null;

  // Stay honest about placeholders: the "will be replaced" note only shows while
  // every review on display is still flagged as a demo entry.
  const allDemo = testimonials.every((t) => t.isDemo);

  return (
    <section className="py-14 sm:py-24 lg:py-28">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Testimonials"
              title="What gardeners are saying"
              description={
                allDemo
                  ? "Real feedback matters to us — these placeholders will be replaced with genuine customer reviews at launch."
                  : "Feedback from gardeners and farmers who use ADHYANTHA."
              }
            />
            <Link
              href="/testimonials"
              className="group flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-canopy)] transition-colors hover:bg-white"
            >
              Read all reviews{" "}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-9 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} index={i} className="h-full">
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
