import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PANEL_GLASS } from "@/components/admin/admin-ui";

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
    neutral: "bg-canopy/10 text-canopy",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-error-bg text-error",
  }[tone];

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", toneClasses)}>
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(PANEL_GLASS, "glass-lift block p-5")}>
        {content}
      </Link>
    );
  }

  return <div className={cn(PANEL_GLASS, "p-5")}>{content}</div>;
}
