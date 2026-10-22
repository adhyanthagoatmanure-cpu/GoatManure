import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-[var(--color-parchment-deep)] text-[var(--color-stone)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error)]",
  info: "bg-[var(--color-sage)] text-[var(--color-canopy)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** The recurring "₹200 → ₹149" discount tag used on product cards & detail pages. */
export function DiscountBadge({ original, offer }: { original: number; offer: number }) {
  if (original <= offer) return null;
  const pct = Math.round(((original - offer) / original) * 100);
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-gold)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink)] shadow-[0_4px_10px_-4px_rgba(138,106,10,0.6)]">
      {pct}% OFF
    </span>
  );
}
