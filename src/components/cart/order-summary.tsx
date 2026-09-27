"use client";

import { useState } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { PriceCartResult } from "@/server/services/pricing.service";

export function OrderSummary({
  priced,
  couponInput,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  footer,
}: {
  priced: PriceCartResult;
  couponInput?: string;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  isApplyingCoupon?: boolean;
  footer?: React.ReactNode;
}) {
  const [code, setCode] = useState(couponInput ?? "");

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <h2 className="font-display text-lg font-medium">Order Summary</h2>

      {onApplyCoupon && (
        <div className="mt-4">
          {priced.coupon ? (
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-success-bg)] px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-success)]">
                <Tag className="h-3.5 w-3.5" /> {priced.coupon.code} applied
              </span>
              <button onClick={onRemoveCoupon} aria-label="Remove coupon" className="text-[var(--color-success)] hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) onApplyCoupon(code.trim());
              }}
              className="flex gap-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter Coupon Code"
                className="h-11 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white px-3.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--color-canopy)]/30"
              />
              <button
                type="submit"
                disabled={isApplyingCoupon || !code.trim()}
                className="rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPLY"}
              </button>
            </form>
          )}
          {priced.couponError && (
            <p className="mt-2 text-xs font-medium text-[var(--color-error)]">{priced.couponError}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-5 text-sm">
        <Row label="Subtotal" value={formatINR(priced.subtotal)} />
        {priced.discountAmount > 0 && (
          <Row label="Coupon Discount" value={`− ${formatINR(priced.discountAmount)}`} tone="success" />
        )}
        <Row label="Shipping" value={priced.shippingFee === 0 ? "FREE" : formatINR(priced.shippingFee)} tone={priced.shippingFee === 0 ? "success" : undefined} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <span className="font-display text-base font-medium">Grand Total</span>
        <span className="font-display text-xl font-semibold">{formatINR(priced.totalAmount)}</span>
      </div>

      {footer}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-stone)]">{label}</span>
      <span className={tone === "success" ? "font-medium text-[var(--color-success)]" : "text-[var(--color-ink)]"}>
        {value}
      </span>
    </div>
  );
}
