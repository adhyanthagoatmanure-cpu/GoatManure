"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import type { ProductListItem } from "@/server/services/product.service";

export default function WishlistPage() {
  const [items, setItems] = useState<ProductListItem[] | null>(null);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data) => setItems((data.items ?? []).map((i: { product: ProductListItem }) => i.product)));
  }, []);

  if (items === null) return <PageSpinner />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Tap the heart icon on any product to save it here for later."
        actionLabel="Browse Products"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {items.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
