import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-canopy)] text-white hover:bg-[var(--color-canopy-dark)] focus-visible:outline-[var(--color-canopy)]",
  secondary:
    "bg-[var(--color-bronze)] text-white hover:bg-[var(--color-bronze-dark)] focus-visible:outline-[var(--color-bronze)]",
  outline:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:bg-[var(--color-parchment-deep)]",
  ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]",
  danger: "bg-[var(--color-error)] text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
  lg: "h-13 px-7 text-base rounded-[var(--radius-md)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
