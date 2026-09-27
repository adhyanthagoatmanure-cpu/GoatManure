"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = type === "password";
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && isVisible ? "text" : type}
            className={cn(
              "h-11 w-full rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)]",
              "placeholder:text-[var(--color-stone-light)] transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-canopy)]/30 focus:border-[var(--color-canopy)]",
              error ? "border-[var(--color-error)]" : "border-[var(--color-border-strong)]",
              props.disabled && "opacity-60 cursor-not-allowed bg-[var(--color-parchment-deep)]",
              isPassword && "pr-11",
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-ink)]"
              aria-label={isVisible ? "Hide password" : "Show password"}
              aria-pressed={isVisible}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-[var(--color-stone)]">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
