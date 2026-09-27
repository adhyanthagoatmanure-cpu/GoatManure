import type { Metadata } from "next";
import { Info } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { TestimonialCard } from "@/components/testimonial/testimonial-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Customer Testimonials" };

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container-page py-14 sm:py-20">
      <SectionHeading
        align="center"
        eyebrow="Testimonials"
        title="What Our Customers Say"
        className="mx-auto"
      />

      <div className="mx-auto mt-6 flex max-w-xl items-start gap-2.5 rounded-[var(--radius-sm)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Reviews marked &ldquo;Demo Review&rdquo; are placeholder content and will be replaced with genuine
          customer testimonials as they come in.
        </span>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    </div>
  );
}
