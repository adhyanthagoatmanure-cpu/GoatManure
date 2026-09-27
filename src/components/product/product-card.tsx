"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { DiscountBadge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatINR, cn, normalizeProductImages } from "@/lib/utils";
import type { ProductListItem } from "@/server/services/product.service";

export function ProductCard({ product, index = 0 }: { product: ProductListItem; index?: number }) {
  const { addItem } = useCart();
  const { show } = useToast();
  const router = useRouter();

  const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const outOfStock = !variant || variant.stock <= 0;
  const image = normalizeProductImages(product.images)[0] ?? null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!variant || outOfStock) return;
    addItem(variant.id, 1);
    show(`${product.name} (${variant.weightLabel}) added to cart`);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    if (!variant || outOfStock) return;
    addItem(variant.id, 1);
    router.push("/checkout");
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-[var(--shadow-lifted)]"
    >
      <div className="relative flex aspect-[4/3.4] items-center justify-center bg-[var(--color-parchment-deep)] p-6">
        {variant && product.variants.length > 0 && (
          <div className="absolute left-3 top-3 z-10">
            <DiscountBadge original={variant.originalPrice} offer={variant.offerPrice} />
          </div>
        )}
        {outOfStock && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-[var(--color-ink)]/85 px-2.5 py-1 text-[11px] font-medium text-white">
            Out of Stock
          </div>
        )}
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            priority={index < 4}
          />
        ) : (
          <div className="h-full w-full rounded-[var(--radius-sm)] bg-[var(--color-border)]" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-bronze)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-1 font-display text-base font-medium text-[var(--color-ink)]">
          {product.name}
        </h3>
        {product.reviewCount > 0 && (
          <Rating value={product.avgRating} count={product.reviewCount} className="mt-1.5" />
        )}

        <div className="mt-2.5 flex items-baseline gap-2">
          {variant ? (
            <>
              <span className="font-display text-lg font-semibold text-[var(--color-ink)]">
                {formatINR(variant.offerPrice)}
              </span>
              {variant.originalPrice > variant.offerPrice && (
                <span className="text-sm text-[var(--color-stone)] line-through">
                  {formatINR(variant.originalPrice)}
                </span>
              )}
              <span className="text-xs text-[var(--color-stone)]">/ {variant.weightLabel}</span>
            </>
          ) : (
            <span className="text-sm text-[var(--color-stone)]">Unavailable</span>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-canopy)] py-2.5 text-sm font-medium text-[var(--color-canopy)] transition-colors",
              "hover:bg-[var(--color-canopy)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-canopy)]"
            )}
          >
            <ShoppingBag className="h-4 w-4" /> Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-canopy)] py-2.5 text-sm font-medium text-white transition-colors",
              "hover:bg-[var(--color-canopy-dark)] disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            <Zap className="h-4 w-4" /> Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
