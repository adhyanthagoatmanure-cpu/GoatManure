"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn, normalizeProductImages } from "@/lib/utils";

/** Soft light "studio" backdrop behind product imagery — keeps transparent bags and cut-outs readable. */
const STAGE =
  "border border-[var(--glass-edge)] bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,var(--color-sage)_100%)] shadow-[var(--shadow-soft)]";

export function ProductGallery({ images, productName }: { images: unknown; productName: string }) {
  const [active, setActive] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<Set<string>>(() => new Set());
  const gallery = normalizeProductImages(images);

  if (gallery.length === 0) {
    return (
      <div className={cn("flex aspect-square w-full items-center justify-center rounded-[var(--radius-xl)] text-[var(--color-stone)]", STAGE)}>
        <Package className="h-14 w-14" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
      <div className={cn("relative aspect-square flex-1 overflow-hidden rounded-[var(--radius-xl)]", STAGE)}>
        {unavailableImages.has(gallery[active]) ? (
          <div role="img" aria-label={`${productName} image unavailable`} className="absolute inset-0 flex items-center justify-center text-[var(--color-stone)]">
            <Package className="h-14 w-14" />
          </div>
        ) : (
          <Image
            src={gallery[active]}
            alt={productName}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-contain p-6 sm:p-8"
            priority
            onError={() => setUnavailableImages((current) => new Set(current).add(gallery[active]))}
          />
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto p-1 sm:w-24 sm:flex-col sm:overflow-visible">
          {gallery.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 bg-white/80 transition-[border-color,box-shadow] sm:w-full",
                active === i
                  ? "border-[var(--color-canopy)] shadow-[0_6px_14px_-8px_rgba(28,51,20,0.6)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-canopy-light)]"
              )}
            >
              {unavailableImages.has(img) ? (
                <Package aria-hidden="true" className="absolute inset-0 m-auto h-5 w-5 text-[var(--color-stone)]" />
              ) : (
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-1.5"
                  onError={() => setUnavailableImages((current) => new Set(current).add(img))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
