import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { BlogCard } from "@/components/blog/blog-card";
import { prisma } from "@/lib/prisma";

export async function BlogSection() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
  if (posts.length === 0) return null;

  return (
    <section className="bg-[var(--color-parchment-deep)]/35 py-16 sm:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="From the Garden Journal"
            title="Latest from our blog"
            description="Tips, guides, and stories on organic gardening and soil health."
          />
          <Link href="/blog" className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-canopy)] hover:underline">
            Visit the blog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
