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
    <div className="flex flex-col gap-3">
      {activeQuery && (
        <div className="flex w-fit max-w-full items-center gap-2 rounded-full bg-[var(--color-sage)] py-1.5 pl-3.5 pr-1.5 text-sm text-[var(--color-canopy-dark)]">
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            Results for <strong>&ldquo;{activeQuery}&rdquo;</strong>
          </span>
          <button
            onClick={() => updateParam("q", "")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/70"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="glass flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] p-3 sm:p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
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

        <div className="w-full sm:ml-auto sm:w-52">
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
      aria-pressed={active}
      className={cn(
        "h-10 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow]",
        active
          ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white shadow-[0_6px_14px_-8px_rgba(28,51,20,0.7)]"
          : "border-[var(--color-border-strong)] bg-white/80 text-[var(--color-ink)] hover:border-[var(--color-canopy-light)] hover:bg-[var(--color-sage)]"
      )}
    >
      {children}
    </button>
  );
}
