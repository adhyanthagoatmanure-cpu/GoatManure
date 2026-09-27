"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { formatINR } from "@/lib/utils";
import type { PricedLine } from "@/server/services/pricing.service";

export function CartLineItem({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: PricedLine;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const overStock = line.quantity > line.availableStock;

  return (
    <div className="flex gap-4 border-b border-[var(--color-border)] py-5 last:border-0">
      <Link
        href={`/products/${line.productSlug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-parchment-deep)] sm:h-24 sm:w-24"
      >
        {line.image && <Image src={line.image} alt={line.productName} fill className="object-contain p-2" />}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-3">
          <div>
            <Link href={`/products/${line.productSlug}`} className="font-medium leading-snug hover:text-[var(--color-canopy)]">
              {line.productName}
            </Link>
            <p className="mt-0.5 text-sm text-[var(--color-stone)]">{line.weightLabel}</p>
          </div>
          <button
            onClick={() => onRemove(line.variantId)}
            aria-label="Remove item"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-stone)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {overStock && (
          <p className="mt-1 text-xs font-medium text-[var(--color-error)]">
            Only {line.availableStock} in stock — please reduce quantity.
          </p>
        )}

        <div className="mt-2 flex items-end justify-between">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            onChange={(q) => onQuantityChange(line.variantId, q)}
            max={Math.max(1, line.availableStock)}
          />
          <div className="text-right">
            <p className="font-display text-base font-semibold">{formatINR(line.lineTotal)}</p>
            {line.originalPrice > line.unitPrice && (
              <p className="text-xs text-[var(--color-stone)] line-through">
                {formatINR(line.originalPrice * line.quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
