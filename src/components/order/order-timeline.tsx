import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@prisma/client";

export function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-error)] text-white">
          <X className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-[var(--color-error)]">Order Cancelled</p>
          <p className="text-sm text-[var(--color-stone)]">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  /*
    Vertical stack by default; becomes a horizontal stepper when the card it sits in is wide enough
    (container query, so it also adapts inside narrow columns, not just on wide screens).
  */
  return (
    <div className="@container">
      <ol className="flex flex-col @lg:flex-row">
        {ORDER_STATUS_FLOW.map((status, i) => {
          const done = i <= currentIndex;
          const isLast = i === ORDER_STATUS_FLOW.length - 1;
          return (
            <li key={status} className="flex gap-4 @lg:flex-1 @lg:flex-col @lg:gap-3" aria-current={i === currentIndex ? "step" : undefined}>
              <div className="flex flex-col items-center @lg:flex-row">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    done
                      ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white"
                      : "border-[var(--color-field-border)] text-[var(--color-field-border)]"
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-2 w-2 fill-current" aria-hidden />}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "min-h-8 w-0.5 flex-1 @lg:mx-2 @lg:h-0.5 @lg:min-h-0 @lg:w-auto",
                      done && i < currentIndex ? "bg-[var(--color-canopy)]" : "bg-[var(--color-border-strong)]"
                    )}
                  />
                )}
              </div>
              <div className="pb-8 @lg:pb-0 @lg:pr-2">
                {/* Upcoming steps keep full-contrast text (stone, 6.9:1); state is carried by the marker, weight and a text cue. */}
                <p className={cn("font-semibold @lg:text-[13px] @lg:leading-snug", done ? "text-[var(--color-ink)]" : "font-medium text-[var(--color-stone)]")}>
                  {ORDER_STATUS_LABELS[status]}
                  <span className="sr-only">{done ? (i === currentIndex ? " — current status" : " — completed") : " — upcoming"}</span>
                </p>
                {i === currentIndex && (
                  <p aria-hidden className="text-xs font-semibold text-[var(--color-canopy)]">Current status</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
