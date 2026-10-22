import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Garden Journal — Tips, Guides & Stories",
  description: "Guides on organic gardening, soil health, and getting the most out of goat manure fertilizer.",
};

const CHIP =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors sm:min-h-10";
const CHIP_IDLE = "border-border-strong bg-white/70 text-ink hover:border-canopy-light hover:bg-sage";
const CHIP_ACTIVE = "border-canopy bg-canopy text-white shadow-[0_8px_18px_-10px_rgba(28,51,20,0.7)]";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category } : {}),
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categoryList = categories.map((c) => c.category).filter((c): c is string => Boolean(c));

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8 max-w-xl sm:mb-10">
        <p className="eyebrow">Tips, guides &amp; stories</p>
        <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">The Garden Journal</h1>
        <p className="mt-3 text-stone">
          Practical tips, stories, and guides on organic gardening and soil health.
        </p>
      </header>

      {categoryList.length > 0 && (
        <nav aria-label="Article categories" className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            aria-current={!category ? "page" : undefined}
            className={cn(CHIP, !category ? CHIP_ACTIVE : CHIP_IDLE)}
          >
            All
          </Link>
          {categoryList.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              aria-current={category === c ? "page" : undefined}
              className={cn(CHIP, category === c ? CHIP_ACTIVE : CHIP_IDLE)}
            >
              {c}
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles found" description="Check back soon for new posts." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
