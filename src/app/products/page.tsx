import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts, getCategories } from "@/server/services/product.service";
import { PackageSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop Organic Goat Manure & Garden Products",
  description: "Browse ADHYANTHA's range of organic goat manure fertilizer and natural gardening products.",
};

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";
const VALID_SORTS: SortOption[] = ["newest", "price_asc", "price_desc", "rating"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const sort: SortOption = VALID_SORTS.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "newest";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, totalPages }, categories] = await Promise.all([
    getProducts({ q: params.q, categorySlug: params.category, sort, page, pageSize: 12 }),
    getCategories(),
  ]);

  function buildHref(targetPage: number) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.category) p.set("category", params.category);
    if (sort !== "newest") p.set("sort", sort);
    if (targetPage > 1) p.set("page", String(targetPage));
    const qs = p.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Shop All Products</h1>
        <p className="mt-2 text-[var(--color-stone)]">
          Organic, natural, and sustainably packed — for every garden size.
        </p>
      </div>

      <ProductFilters categories={categories} />

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={PackageSearch}
            title="No products found"
            description="Try a different search term or clear your filters."
            actionLabel="View All Products"
            actionHref="/products"
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
