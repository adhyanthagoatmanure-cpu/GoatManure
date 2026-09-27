import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@prisma/client";

export function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-error)] text-white">
          <X className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-medium text-[var(--color-error)]">Order Cancelled</p>
          <p className="text-sm text-[var(--color-stone)]">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <ol className="flex flex-col">
      {ORDER_STATUS_FLOW.map((status, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  done
                    ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white"
                    : "border-[var(--color-border-strong)] text-[var(--color-border-strong)]"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Circle className="h-2 w-2 fill-current" />}
              </span>
              {!isLast && (
                <span className={cn("w-0.5 flex-1 min-h-8", done && i < currentIndex ? "bg-[var(--color-canopy)]" : "bg-[var(--color-border-strong)]")} />
              )}
            </div>
            <div className={cn("pb-8", !done && "opacity-50")}>
              <p className={cn("font-medium", done ? "text-[var(--color-ink)]" : "text-[var(--color-stone)]")}>
                {ORDER_STATUS_LABELS[status]}
              </p>
              {i === currentIndex && (
                <p className="text-xs text-[var(--color-canopy)]">Current status</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
