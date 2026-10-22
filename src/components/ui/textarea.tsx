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
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-[var(--radius-sm)] border bg-white/90 px-3.5 py-2.5 text-sm text-[var(--color-ink)]",
            "placeholder:text-[var(--color-stone-light)] transition-[border-color,box-shadow,background-color] min-h-[110px] resize-y",
            "focus:outline-none focus:bg-white focus:ring-4 focus:ring-[var(--color-canopy)]/15 focus:border-[var(--color-canopy)]",
            error ? "border-[var(--color-error)]" : "border-[var(--color-field-border)]",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} role="alert" className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
