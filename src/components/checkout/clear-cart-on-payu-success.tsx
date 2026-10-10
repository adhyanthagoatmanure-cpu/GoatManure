"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/providers/cart-provider";

export function ClearCartOnPayUSuccess({ enabled }: { enabled: boolean }) {
  const { clearCart, isHydrated } = useCart();
  const didClear = useRef(false);

  useEffect(() => {
    if (enabled && isHydrated && !didClear.current) {
      didClear.current = true;
      clearCart();
    }
  }, [clearCart, enabled, isHydrated]);

  return null;
}
