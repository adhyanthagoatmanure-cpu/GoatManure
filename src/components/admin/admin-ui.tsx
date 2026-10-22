import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  Small presentational helpers shared by every admin screen so the pages stay consistent.
  Pure markup + design-token classes (see design-system/adhyantha/MASTER.md): safe to use from
  both server and client components.

  Glass budget: PANEL_GLASS (backdrop blur) is for chrome and summary cards/charts only.
  Anything that repeats or holds dense data — tables, forms, lists — uses PANEL (no blur).
*/

/** Frosted panel: summary cards, chart panels. A handful per screen at most. */
export const PANEL_GLASS = "glass rounded-[var(--radius-md)]";

/** Opaque-ish panel without backdrop blur: tables, forms, lists, filters. */
export const PANEL = "surface rounded-[var(--radius-md)]";

/** Table building blocks (apply to <thead>, <th>, <tbody>, <tr>, <td>). */
export const TABLE_HEAD = "bg-sage/60 text-left text-xs font-semibold uppercase tracking-wide text-stone";
export const TH = "px-4 py-3 font-semibold";
export const TBODY = "divide-y divide-border";
export const TR = "transition-colors hover:bg-sage/40";
export const TD = "px-4 py-3.5 align-middle";

/** 44px touch target on phones, 36px on larger screens. */
export const ICON_BUTTON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-stone transition-colors hover:bg-sage hover:text-canopy sm:h-9 sm:w-9";
export const ICON_BUTTON_DANGER =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-error transition-colors hover:bg-error-bg sm:h-9 sm:w-9";

/** Compact, readable text field that sits inside a toolbar/filter row. */
export const FIELD =
  "h-11 w-full rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3 text-sm text-ink placeholder:text-stone-light transition-[border-color,box-shadow,background-color] focus:border-canopy focus:bg-white focus:outline-none focus:ring-4 focus:ring-canopy/15";

/** Round icon chip that sits beside page titles. */
export function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-sage text-canopy ring-1 ring-inset ring-canopy/10",
        className
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

/** Title block at the top of an admin screen: icon, optional eyebrow, h1, description, actions. */
export function AdminPageHeader({
  icon,
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconChip icon={icon} />}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-stone">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Table wrapper: rounded no-blur panel with horizontal scroll so wide tables never overflow the page. */
export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(PANEL, "overflow-hidden", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Text used for empty lists inside a panel. */
export function EmptyNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("p-8 text-center text-sm text-stone", className)}>{children}</p>;
}
