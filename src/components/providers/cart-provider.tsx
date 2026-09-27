"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/types";

const STORAGE_KEY = "adhyantha_cart_v1";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  isHydrated: boolean;
  addItem: (variantId: string, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read localStorage only after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // corrupted local data — start fresh rather than crash the app
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, isHydrated]);

  const addItem = (variantId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === variantId ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { variantId, quantity }];
    });
  };

  const removeItem = (variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  };

  const setQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) return removeItem(variantId);
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)));
  };

  const clearCart = () => setLines([]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{ lines, itemCount, isHydrated, addItem, removeItem, setQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
