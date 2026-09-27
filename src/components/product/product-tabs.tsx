"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Rating } from "@/components/ui/rating";
import { ReviewForm } from "./review-form";
import type { Review } from "@prisma/client";

interface Props {
  productId: string;
  description: string;
  howToUse: string | null;
  shippingInfo: string | null;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

const TABS = ["Description", "How to Use", "Shipping Info", "Reviews"] as const;

export function ProductTabs({ productId, description, howToUse, shippingInfo, reviews, avgRating, reviewCount }: Props) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Description");

  return (
    <div className="mt-16">
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active === tab
                ? "border-[var(--color-canopy)] text-[var(--color-canopy)]"
                : "border-transparent text-[var(--color-stone)] hover:text-[var(--color-ink)]"
            )}
          >
            {tab} {tab === "Reviews" && reviewCount > 0 && `(${reviewCount})`}
          </button>
        ))}
      </div>

      <div className="py-8">
        {active === "Description" && (
          <div className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-ink)]">
            {description}
          </div>
        )}
        {active === "How to Use" && (
          <div className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-ink)]">
            {howToUse || "Usage instructions for this product will be added soon."}
          </div>
        )}
        {active === "Shipping Info" && (
          <div className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-ink)]">
            {shippingInfo ||
              "Orders are dispatched within 1-2 business days and typically delivered within 4-7 business days depending on your location. Free shipping on orders above ₹499; a flat ₹49 shipping fee applies below that. Cash on Delivery is available across serviceable pincodes."}
          </div>
        )}
        {active === "Reviews" && (
          <div className="max-w-2xl">
            {reviewCount > 0 && (
              <div className="mb-6 flex items-center gap-3">
                <span className="font-display text-3xl font-semibold">{avgRating.toFixed(1)}</span>
                <div>
                  <Rating value={avgRating} size="md" />
                  <p className="text-xs text-[var(--color-stone)]">Based on {reviewCount} reviews</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-5">
              {reviews.length === 0 && (
                <p className="text-sm text-[var(--color-stone)]">No reviews yet — be the first to share your experience.</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.authorName}</p>
                    <p className="text-xs text-[var(--color-stone)]">{formatDate(r.createdAt)}</p>
                  </div>
                  <Rating value={r.rating} className="mt-1" />
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">{r.comment}</p>
                </div>
              ))}
            </div>
            <ReviewForm productId={productId} />
          </div>
        )}
      </div>
    </div>
  );
}
