import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "error";
  hint?: string;
  href?: string;
}) {
  const toneClasses = {
    neutral: "bg-[var(--color-canopy)]/10 text-[var(--color-canopy)]",
    success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    error: "bg-[var(--color-error-bg)] text-[var(--color-error)]",
  }[tone];

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-stone)]">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", toneClasses)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-stone)]">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-canopy-light)] hover:bg-[var(--color-parchment-deep)]/30"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      {content}
    </div>
  );
}
