"use client";

import { useId, useRef, useState } from "react";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { SHIPPING_CONFIG } from "@/lib/config";
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
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = TABS.indexOf(active);

  // Arrow-key / Home / End navigation between tabs (WAI-ARIA tabs pattern).
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActive(TABS[next]);
    tabRefs.current[next]?.focus();
  }

  const bodyClass = "max-w-2xl whitespace-pre-line text-base leading-relaxed text-[var(--color-ink)]";

  return (
    <div className="mt-16 sm:mt-20">
      <div
        role="tablist"
        aria-label="Product information"
        className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5"
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={active === tab}
            aria-controls={`${uid}-panel`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] sm:px-5",
              active === tab
                ? "bg-[var(--color-canopy)] text-white shadow-[0_6px_14px_-8px_rgba(28,51,20,0.7)]"
                : "text-[var(--color-stone)] hover:bg-white/80 hover:text-[var(--color-ink)]"
            )}
          >
            {tab} {tab === "Reviews" && reviewCount > 0 && `(${reviewCount})`}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${activeIndex}`}
        tabIndex={0}
        className="surface mt-5 rounded-[var(--radius-lg)] p-6 sm:p-8"
      >
        {active === "Description" && <div className={bodyClass}>{description}</div>}
        {active === "How to Use" && (
          <div className={bodyClass}>{howToUse || "Usage instructions for this product will be added soon."}</div>
        )}
        {active === "Shipping Info" && (
          <div className={bodyClass}>
            {shippingInfo ||
              `Orders are dispatched within 1-2 business days and typically delivered within 4-7 business days depending on your location. Free shipping on orders above ${formatINR(SHIPPING_CONFIG.freeAboveSubtotal)}; a flat ${formatINR(SHIPPING_CONFIG.flatFee)} shipping fee applies below that. Cash on Delivery is available across serviceable pincodes.`}
          </div>
        )}
        {active === "Reviews" && (
          <div className="max-w-2xl">
            {reviewCount > 0 && (
              <div className="mb-6 flex items-center gap-3">
                <span className="font-display text-4xl font-semibold">{avgRating.toFixed(1)}</span>
                <div>
                  <Rating value={avgRating} size="md" />
                  <p className="text-xs text-[var(--color-stone)]">Based on {reviewCount} reviews</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {reviews.length === 0 && (
                <p className="text-sm text-[var(--color-stone)]">No reviews yet — be the first to share your experience.</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-[var(--radius-md)] bg-[var(--color-parchment)] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{r.authorName}</p>
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
