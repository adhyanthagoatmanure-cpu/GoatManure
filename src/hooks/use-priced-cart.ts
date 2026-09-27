"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { PriceCartResult } from "@/server/services/pricing.service";

export function usePricedCart(couponCode?: string) {
  const { lines, isHydrated } = useCart();
  const [data, setData] = useState<PriceCartResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isHydrated) return;
    if (lines.length === 0) {
      setData({
        lines: [],
        unavailableVariantIds: [],
        stockIssues: [],
        subtotal: 0,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount: 0,
        coupon: null,
        couponError: null,
      });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines, couponCode }),
      });
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, JSON.stringify(lines), couponCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
