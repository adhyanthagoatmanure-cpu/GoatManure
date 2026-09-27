import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)]",
            "placeholder:text-[var(--color-stone-light)] transition-colors min-h-[110px] resize-y",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-canopy)]/30 focus:border-[var(--color-canopy)]",
            error ? "border-[var(--color-error)]" : "border-[var(--color-border-strong)]",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
