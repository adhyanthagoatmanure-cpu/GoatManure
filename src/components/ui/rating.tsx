import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i <= Math.round(value) ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "fill-none text-[var(--color-border-strong)]"
            )}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-[var(--color-stone)]">({count})</span>
      )}
    </div>
  );
}
