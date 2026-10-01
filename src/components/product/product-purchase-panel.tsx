"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingBag, Zap, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { DiscountBadge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatINR, cn } from "@/lib/utils";
import type { ProductVariant } from "@prisma/client";

export function ProductPurchasePanel({
  productId,
  productName,
  variants,
}: {
  productId: string;
  productName: string;
  variants: ProductVariant[];
}) {
  const sorted = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
  const [selectedId, setSelectedId] = useState(
    sorted.find((v) => v.isDefault)?.id ?? sorted[0]?.id
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const { addItem } = useCart();
  const { show } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  const selected = sorted.find((v) => v.id === selectedId) ?? sorted[0];
  if (!selected) return null;
  const outOfStock = selected.stock <= 0;
  const lowStock = selected.stock > 0 && selected.stock <= selected.lowStockThreshold;

  function handleAddToCart() {
    addItem(selected.id, quantity);
    show(`${productName} (${selected.weightLabel}) × ${quantity} added to cart`);
  }

  function handleBuyNow() {
    addItem(selected.id, quantity);
    router.push("/checkout");
  }

  async function toggleWishlist() {
    if (!session) {
      show("Please log in to save items to your wishlist", "error");
      router.push(`/login?callbackUrl=/products`);
      return;
    }
    setWishlistBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlisted((w) => !w);
        show(wishlisted ? "Removed from wishlist" : "Added to wishlist");
      }
    } finally {
      setWishlistBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-semibold">{formatINR(selected.offerPrice)}</span>
        {selected.originalPrice > selected.offerPrice && (
          <span className="text-lg text-[var(--color-stone)] line-through">
            {formatINR(selected.originalPrice)}
          </span>
        )}
        <DiscountBadge original={selected.originalPrice} offer={selected.offerPrice} />
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-[var(--color-ink)]">
          Weight: <span className="text-[var(--color-stone)]">{selected.weightLabel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {sorted.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              disabled={v.stock <= 0}
              className={cn(
                "rounded-[var(--radius-sm)] border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                selectedId === v.id
                  ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white"
                  : "border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-canopy)]"
              )}
            >
              {v.weightLabel}
              {v.stock <= 0 && <span className="ml-1 text-xs">(Out)</span>}
            </button>
          ))}
        </div>
      </div>

      {outOfStock ? (
        <p className="text-sm font-medium text-[var(--color-error)]">
          This weight is currently out of stock. Try another size above.
        </p>
      ) : lowStock ? (
        <p className="text-sm font-medium text-[var(--color-warning)]">
          Only {selected.stock} left in stock — order soon.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm font-medium">Quantity</p>
        <QuantitySelector value={quantity} onChange={setQuantity} max={Math.min(20, selected.stock || 20)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="outline" className="min-h-13 w-full min-w-0 px-4 sm:flex-1 sm:px-7" onClick={handleAddToCart} disabled={outOfStock}>
          <ShoppingBag className="h-4 w-4" /> Add to Cart
        </Button>
        <Button size="lg" className="min-h-13 w-full min-w-0 px-4 sm:flex-1 sm:px-7" onClick={handleBuyNow} disabled={outOfStock}>
          <Zap className="h-4 w-4" /> Buy Now
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={toggleWishlist}
          disabled={wishlistBusy}
          aria-label="Add to wishlist"
          aria-pressed={wishlisted}
          className="min-h-13 w-full min-w-0 gap-2 px-4 sm:w-14 sm:flex-none sm:px-0"
        >
          {wishlisted ? (
            <Heart className="h-5 w-5 fill-[var(--color-error)] text-[var(--color-error)]" />
          ) : (
            <Heart className="h-5 w-5" />
          )}
          <span className="sm:hidden">{wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}</span>
        </Button>
      </div>

      <ul className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-stone)]">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-[var(--color-canopy)]" /> 100% organic, chemical-free
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-[var(--color-canopy)]" /> Cash on Delivery available
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-[var(--color-canopy)]" /> Free shipping above ₹499
        </li>
      </ul>
    </div>
  );
}
