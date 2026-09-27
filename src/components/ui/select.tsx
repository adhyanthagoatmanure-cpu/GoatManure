import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full appearance-none rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3.5 pr-9 text-sm text-[var(--color-ink)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-canopy)]/30 focus:border-[var(--color-canopy)]",
              error ? "border-[var(--color-error)]" : "border-[var(--color-border-strong)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-stone)]" />
        </div>
        {error && <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
