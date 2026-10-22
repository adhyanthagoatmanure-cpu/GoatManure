import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Typed helper for passing CSS custom properties through `style`. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/**
 * Fade/rise as the element scrolls into view. Pure CSS (scroll-driven animation):
 * no JavaScript, content is never hidden by default, and browsers without support
 * or users who prefer reduced motion simply see the final state.
 *
 * Note: don't put a hover `transform` on the same element — the animation's end
 * state would override it. Wrap the interactive element instead.
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  /** Stagger position among siblings (0–8). */
  index?: number;
  className?: string;
}) {
  return (
    <div className={cn("reveal", className)} style={cssVars({ "--i": Math.min(Math.max(index, 0), 8) })}>
      {children}
    </div>
  );
}
