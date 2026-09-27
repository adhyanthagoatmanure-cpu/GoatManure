"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)]">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(dim, "flex items-center justify-center text-[var(--color-ink)] disabled:opacity-30 hover:bg-[var(--color-parchment-deep)] rounded-l-[var(--radius-sm)]")}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn("flex items-center justify-center text-sm font-medium tabular-nums", size === "sm" ? "w-8" : "w-10")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(dim, "flex items-center justify-center text-[var(--color-ink)] disabled:opacity-30 hover:bg-[var(--color-parchment-deep)] rounded-r-[var(--radius-sm)]")}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
