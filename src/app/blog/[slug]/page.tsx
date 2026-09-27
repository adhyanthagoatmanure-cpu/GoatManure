import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Calendar, User } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { BlogComments } from "@/components/blog/blog-comments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK_IMAGE = "/images/02_hands_with_soil_seedling.jpg";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  const related = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", id: { not: post.id }, ...(post.category ? { category: post.category } : {}) },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <article className="container-page py-8 sm:py-12">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-stone)]">
        <Link href="/blog" className="hover:text-[var(--color-canopy)]">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-[var(--color-ink)]">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        {post.category && (
          <span className="rounded-full bg-[var(--color-canopy)]/10 px-3 py-1 text-xs font-medium text-[var(--color-canopy)]">
            {post.category}
          </span>
        )}
        <h1 className="mt-4 text-balance font-display text-3xl font-medium leading-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-[var(--color-stone)]">
          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt ?? post.createdAt)}</span>
        </div>

        <div className="relative mt-8 flex aspect-[21/9] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-canopy)]">
          {/* Blog images may be local uploads or existing absolute URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featuredImage || FALLBACK_IMAGE} alt={post.title} className="h-full w-full object-cover" />
        </div>

        <div className="prose prose-neutral mt-10 max-w-none whitespace-pre-line text-[16px] leading-relaxed text-[var(--color-ink)]">
          {post.content}
        </div>
      </div>

      <BlogComments postId={post.id} />

      {related.length > 0 && (
        <div className="mx-auto mt-16 max-w-5xl border-t border-[var(--color-border)] pt-12">
          <h2 className="font-display text-2xl font-medium">Related Articles</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((p, i) => (
              <BlogCard key={p.id} post={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
