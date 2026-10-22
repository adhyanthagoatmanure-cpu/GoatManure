import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
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
    <section className="bg-[linear-gradient(180deg,rgba(232,238,220,0.7)_0%,rgba(232,238,220,0.2)_100%)] py-14 sm:py-24 lg:py-28">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="From the Garden Journal"
              title="Latest from our blog"
              description="Tips, guides, and stories on organic gardening and soil health."
            />
            <Link
              href="/blog"
              className="group flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-canopy)] transition-colors hover:bg-white"
            >
              Visit the blog{" "}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-9 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} index={i} className="h-full">
              <BlogCard post={post} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
