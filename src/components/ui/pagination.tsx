import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink href={buildHref(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1.5 text-[var(--color-stone)]">…</span>}
          <PageLink href={buildHref(p)} active={p === page}>
            {p}
          </PageLink>
        </span>
      ))}
      <PageLink href={buildHref(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  if (disabled) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-stone-light)]">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
        active ? "bg-[var(--color-canopy)] text-white" : "text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
