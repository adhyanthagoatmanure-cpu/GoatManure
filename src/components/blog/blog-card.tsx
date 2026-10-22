import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@prisma/client";

const CARD_TINTS = ["#2B4C1F", "#A15C1E", "#6B6B5E"];
const FALLBACK_IMAGES = [
  "/images/02_hands_with_soil_seedling.jpg",
  "/images/05_seedling_fertile_soil.jpg",
  "/images/07_organic_farming_seedling.jpg",
  "/images/04_farm_land_sunrise.jpg",
];

export function BlogCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="surface glass-lift group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)]"
    >
      <div
        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
        style={{ backgroundColor: CARD_TINTS[index % CARD_TINTS.length] }}
      >
        {/* Blog images may be local uploads or existing absolute URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.featuredImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[11px] font-bold text-[var(--color-ink)] backdrop-blur-sm">
            {post.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-[var(--color-stone)]">{formatDate(post.publishedAt ?? post.createdAt)}</p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-lg font-medium leading-snug">{post.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--color-stone)]">
          {post.excerpt}
        </p>
        <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-canopy)]">
          Read More <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
