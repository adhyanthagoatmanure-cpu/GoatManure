"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeQuery = searchParams.get("q") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {activeQuery && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-parchment-deep)] px-3.5 py-2 text-sm">
          <Search className="h-3.5 w-3.5 text-[var(--color-stone)]" />
          Results for <strong>&ldquo;{activeQuery}&rdquo;</strong>
          <button
            onClick={() => updateParam("q", "")}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--color-border)]"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!activeCategory} onClick={() => updateParam("category", "")}>
            All
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              active={activeCategory === cat.slug}
              onClick={() => updateParam("category", cat.slug)}
            >
              {cat.name}
            </FilterChip>
          ))}
        </div>

        <div className="ml-auto w-44">
          <Select
            aria-label="Sort products"
            value={activeSort}
            onChange={(e) => updateParam("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white"
          : "border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-canopy)]"
      )}
    >
      {children}
    </button>
  );
}
