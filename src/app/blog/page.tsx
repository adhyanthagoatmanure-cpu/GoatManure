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
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">The Garden Journal</h1>
        <p className="mt-2 text-[var(--color-stone)]">
          Practical tips, stories, and guides on organic gardening and soil health.
        </p>
      </div>

      {categoryList.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              !category ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white" : "border-[var(--color-border-strong)]"
            )}
          >
            All
          </Link>
          {categoryList.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                category === c ? "border-[var(--color-canopy)] bg-[var(--color-canopy)] text-white" : "border-[var(--color-border-strong)]"
              )}
            >
              {c}
            </Link>
          ))}
        </div>
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
