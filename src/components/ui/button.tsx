import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-canopy)] text-white shadow-[0_8px_18px_-8px_rgba(28,51,20,0.65)] hover:bg-[var(--color-canopy-dark)] focus-visible:outline-[var(--color-canopy)]",
  secondary:
    "bg-[var(--color-bronze)] text-white shadow-[0_8px_18px_-8px_rgba(124,69,21,0.55)] hover:bg-[var(--color-bronze-dark)] focus-visible:outline-[var(--color-bronze)]",
  outline:
    "bg-white/70 text-[var(--color-canopy-dark)] border border-[var(--color-border-strong)] hover:border-[var(--color-canopy-light)] hover:bg-[var(--color-sage)]",
  ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-sage)]",
  danger: "bg-[var(--color-error)] text-white hover:opacity-90",
  /** Frosted button for use on top of photography (hero, banners). */
  glass:
    "border border-white/70 bg-white/[0.74] text-[var(--color-canopy-dark)] shadow-[0_8px_24px_-12px_rgba(28,51,20,0.5)] backdrop-blur-md hover:bg-white/[0.92]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
  lg: "h-13 px-7 text-base rounded-[var(--radius-md)]",
};

/** The class list behind <Button> and <ButtonLink>, so both always look identical. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,border-color,box-shadow,color,transform] duration-200 active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

/**
 * A link that looks like a <Button>. Use this instead of nesting <Button> inside <Link>:
 * a button inside an anchor is invalid HTML and gives keyboard and screen-reader users two
 * controls (two tab stops) for one action.
 */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
