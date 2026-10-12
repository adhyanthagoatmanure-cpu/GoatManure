"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn, normalizeProductImages } from "@/lib/utils";


export function ProductGallery({ images, productName }: { images: unknown; productName: string }) {
  const [active, setActive] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<Set<string>>(() => new Set());
  const gallery = normalizeProductImages(images);

  if (gallery.length === 0) {
    return <div className="aspect-square w-full rounded-[var(--radius-lg)] bg-[var(--color-parchment-deep)]" />;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
      <div className="relative aspect-square flex-1 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-parchment-deep)]">
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
            className="object-contain p-8"
            priority
            onError={() => setUnavailableImages((current) => new Set(current).add(gallery[active]))}
          />
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {gallery.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 bg-[var(--color-parchment-deep)] sm:w-full",
                active === i ? "border-[var(--color-canopy)]" : "border-transparent hover:border-[var(--color-border-strong)]"
              )}
            >
              {unavailableImages.has(img) ? (
                <Package aria-hidden="true" className="absolute inset-0 m-auto h-5 w-5 text-[var(--color-stone)]" />
              ) : (
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="80px"
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
