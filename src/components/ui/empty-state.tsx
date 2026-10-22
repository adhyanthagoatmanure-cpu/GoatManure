import type { LucideIcon } from "lucide-react";
import { ButtonLink } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-sage)]">
        <Icon className="h-6 w-6 text-[var(--color-canopy)]" />
      </div>
      <h3 className="font-display text-xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--color-stone)]">{description}</p>}
      {actionLabel && actionHref && (
        <ButtonLink href={actionHref} className="mt-6">
          {actionLabel}
        </ButtonLink>
      )}
    </div>
  );
}
