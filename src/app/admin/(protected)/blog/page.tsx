"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Leaf, MessageCircle,
  Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { cn, formatDate } from "@/lib/utils";
import {
  AdminPageHeader, FIELD, ICON_BUTTON, ICON_BUTTON_DANGER, PANEL,
} from "@/components/admin/admin-ui";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category: string | null;
  status: "PUBLISHED" | "DRAFT";
  author: string;
  createdAt: string;
  publishedAt: string | null;
};

const categoryPills = ["All", "Farming Tips", "Goat Manure", "Organic Living", "Soil Health", "Sustainable Agriculture"];
const fallbackImages = [
  "/images/02_hands_with_soil_seedling.jpg",
  "/images/05_seedling_fertile_soil.jpg",
  "/images/07_organic_farming_seedling.jpg",
  "/images/04_farm_land_sunrise.jpg",
];

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const { show } = useToast();
  const pageSize = 8;

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/blog", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        const message = data.error ?? "Unable to load blog posts.";
        setLoadError(message);
        setPosts([]);
        show(message, "error");
        return;
      }
      setLoadError(null);
      setPosts(data.posts ?? []);
    } catch (error) {
      console.error("Failed to load admin blog posts", error);
      const message = "Unable to load blog posts. Please try again.";
      setLoadError(message);
      setPosts([]);
      show(message, "error");
    }
  }, [show]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const categories = useMemo(() => ["All Categories", ...new Set((posts ?? []).map((post) => post.category).filter((item): item is string => Boolean(item)))], [posts]);
  const filtered = useMemo(() => (posts ?? []).filter((post) => {
    const haystack = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
    const matchesQuery = !submittedQuery || haystack.includes(submittedQuery.toLowerCase());
    const matchesCategory = category === "All" || category === "All Categories" || (post.category ?? "Uncategorized") === category;
    const matchesStatus = status === "All Status" || post.status === status;
    return matchesQuery && matchesCategory && matchesStatus;
  }), [category, posts, status, submittedQuery]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePosts = filtered.slice((page - 1) * pageSize, page * pageSize);
  const popularPosts = [...(posts ?? [])].sort((a, b) => {
    if (a.status !== b.status) return a.status === "PUBLISHED" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 4);

  async function handleDelete(post: Post) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    const response = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
    if (response.ok) {
      show("Article deleted.");
      await load();
    } else {
      show("Unable to delete article.", "error");
    }
  }

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
    setPage(1);
  }

  if (!posts) return <PageSpinner />;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-error/30 bg-error-bg px-4 py-3 text-sm text-error">
          <span>{loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => { setPosts(null); void load(); }}>Retry</Button>
        </div>
      )}
      <AdminPageHeader
        icon={Leaf}
        title="Our Blog"
        description="Learn, grow and stay updated with natural farming tips."
        actions={
          <ButtonLink href="/admin/blog/new">
            <Plus className="h-4 w-4" aria-hidden /> Add New Blog
          </ButtonLink>
        }
      />

      <form onSubmit={applyFilters} className={cn(PANEL, "flex flex-wrap items-center gap-2 p-3")}>
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15">
          <Search className="h-4 w-4 shrink-0 text-stone" aria-hidden />
          <span className="sr-only">Search blog title or content</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search blog title or content..." className="w-full bg-transparent text-sm text-ink placeholder:text-stone-light focus:outline-none" />
        </label>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Filter by category" className={cn(FIELD, "sm:w-auto")}>
          <option>All Categories</option>
          {categories.filter((item) => item !== "All Categories").map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status" className={cn(FIELD, "sm:w-auto")}>
          <option>All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <Button type="submit"><Search className="h-4 w-4" aria-hidden /> Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categoryPills.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => { setCategory(item); setPage(1); }}
            className={cn(
              "min-h-10 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === item
                ? "border-canopy bg-canopy text-white"
                : "border-border-strong bg-white/80 text-stone hover:border-canopy-light hover:bg-sage hover:text-canopy-dark"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">All Articles</h2>
            <span className="text-xs text-stone">{filtered.length} results</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visiblePosts.map((post, index) => {
              const image = post.featuredImage || fallbackImages[(page * pageSize + index) % fallbackImages.length];
              return (
                <article key={post.id} className={cn(PANEL, "flex flex-col overflow-hidden")}>
                  <div className="relative aspect-[1.55] bg-sage">
                    <Image src={image} alt={post.title} fill sizes="(max-width: 1024px) 50vw, 220px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={post.status === "PUBLISHED" ? "success" : "neutral"}>{post.category ?? "Uncategorized"}</Badge>
                      <span className="text-xs text-stone">{post.status}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-ink">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone">{post.excerpt}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-stone">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(post.publishedAt ?? post.createdAt)}
                      <span aria-hidden>•</span>
                      {readingTime(post.content)} min read
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-canopy underline-offset-4 hover:underline">
                        Read More <ArrowRight className="inline h-3 w-3" aria-hidden />
                      </Link>
                      <div className="flex gap-1">
                        <Link href={`/admin/blog/${post.id}`} aria-label={`Edit ${post.title}`} className={ICON_BUTTON}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Link>
                        <button type="button" onClick={() => void handleDelete(post)} aria-label={`Delete ${post.title}`} className={ICON_BUTTON_DANGER}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {visiblePosts.length === 0 && (
            <div className="rounded-[var(--radius-md)] border border-dashed border-border-strong bg-white/70 p-10 text-center text-sm text-stone">No blog posts match these filters.</div>
          )}
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone">
            <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} blogs</span>
            <nav aria-label="Blog pagination" className="flex items-center gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page" className={cn(ICON_BUTTON, "disabled:opacity-40")}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
              <span className="rounded-md bg-canopy px-2.5 py-1 font-semibold text-white" aria-current="page">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className={cn(ICON_BUTTON, "disabled:opacity-40")}><ChevronRight className="h-4 w-4" aria-hidden /></button>
            </nav>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <section className={cn(PANEL, "p-4")}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Popular Posts</h2>
              <Link href="/blog" className="text-xs font-semibold text-canopy underline-offset-4 hover:underline">View All →</Link>
            </div>
            <div className="mt-3 space-y-3">
              {popularPosts.map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-sage">
                    <Image src={post.featuredImage || fallbackImages[index % fallbackImages.length]} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-semibold leading-4 text-ink">{post.title}</p>
                    <p className="mt-1 text-xs text-stone">{formatDate(post.publishedAt ?? post.createdAt)} · {post.status.toLowerCase()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="relative isolate min-h-[160px] overflow-hidden rounded-[var(--radius-md)] bg-canopy-dark p-4 text-white shadow-[var(--shadow-soft)]">
            <Image src="/images/05_seedling_fertile_soil.jpg" alt="" fill sizes="300px" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-canopy-dark via-canopy-dark/70 to-transparent" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-sage-deep">ADHYANTHA</p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">Better Soil<br />Better Tomorrow</h2>
              <Link href="/products" data-on-dark className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] bg-white/15 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/25">
                Explore Products <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </section>
          <section className={cn(PANEL, "p-4")}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Recent Comments</h2>
            </div>
            <div className="mt-3 flex flex-col items-center gap-2 py-4 text-center text-xs text-stone">
              <MessageCircle className="h-6 w-6 text-stone-light" aria-hidden />
              <p>Blog comments are not available in the current database.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
