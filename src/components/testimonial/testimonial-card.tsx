import { Quote } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import type { Testimonial } from "@prisma/client";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-start justify-between gap-3">
        <Quote className="h-7 w-7 shrink-0 text-[var(--color-gold)]" />
        {testimonial.isDemo && (
          <span className="rounded-full bg-[var(--color-warning-bg)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--color-warning)]">
            Demo Review
          </span>
        )}
      </div>
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-[var(--color-ink)]">
        &ldquo;{testimonial.review}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-canopy)]/10 font-display text-sm font-medium text-[var(--color-canopy)]">
          {testimonial.customerName[0]?.toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-medium">{testimonial.customerName}</p>
          {testimonial.location && (
            <p className="text-xs text-[var(--color-stone)]">{testimonial.location}</p>
          )}
        </div>
        <Rating value={testimonial.rating} className="ml-auto" />
      </div>
    </div>
  );
}
