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
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-stone">
        <Link href="/blog" className="rounded font-medium hover:text-canopy">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span aria-current="page" className="line-clamp-1 text-ink">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        {post.category && (
          <span className="inline-block rounded-full bg-sage px-3 py-1 text-xs font-bold text-canopy ring-1 ring-inset ring-canopy/10">
            {post.category}
          </span>
        )}
        <h1 className="mt-4 text-balance font-display text-3xl font-medium leading-tight sm:text-5xl sm:leading-[1.1]">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-stone">
          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" aria-hidden /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden /> {formatDate(post.publishedAt ?? post.createdAt)}</span>
        </div>

        <div className="relative mt-8 flex aspect-[21/9] items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-canopy shadow-[var(--shadow-lifted)] ring-1 ring-canopy/10">
          {/* Blog images may be local uploads or existing absolute URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featuredImage || FALLBACK_IMAGE} alt={post.title} className="h-full w-full object-cover" />
        </div>

        <div className="prose prose-neutral mt-10 max-w-none whitespace-pre-line text-base leading-8 text-ink sm:text-[17px]">
          {post.content}
        </div>
      </div>

      <BlogComments postId={post.id} />

      {related.length > 0 && (
        <section aria-labelledby="related-articles" className="mx-auto mt-16 max-w-5xl border-t border-border pt-12">
          <h2 id="related-articles" className="font-display text-2xl font-medium sm:text-3xl">Related Articles</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((p, i) => (
              <BlogCard key={p.id} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
