"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Leaf, MessageCircle,
  Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate } from "@/lib/utils";

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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0c8c5] bg-[#fff7f6] px-4 py-3 text-sm text-[#a94442]">
          <span>{loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => { setPosts(null); void load(); }}>Retry</Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6e2] text-[#4f9c42]"><Leaf className="h-5 w-5" /></span>
          <div><h1 className="font-display text-2xl font-semibold text-[#173d2b]">Our Blog</h1><p className="text-xs text-[#6b7a70]">Learn, grow and stay updated with natural farming tips.</p></div>
        </div>
        <Link href="/admin/blog/new"><Button><Plus className="h-4 w-4" /> Add New Blog</Button></Link>
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_6px_18px_rgba(20,67,43,0.04)]">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#dfe9df] bg-[#fbfdf9] px-3 py-2"><Search className="h-4 w-4 text-[#849289]" /><span className="sr-only">Search blog title or content</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search blog title or content..." className="w-full bg-transparent text-xs outline-none" /></label>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-lg border border-[#dfe9df] bg-white px-3 py-2 text-xs text-[#315b45] outline-none"><option>All Categories</option>{categories.filter((item) => item !== "All Categories").map((item) => <option key={item}>{item}</option>)}</select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-[#dfe9df] bg-white px-3 py-2 text-xs text-[#315b45] outline-none"><option>All Status</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select>
        <Button type="submit" size="sm"><Search className="h-3.5 w-3.5" /> Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categoryPills.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === item ? "border-[#4f9c42] bg-[#4f9c42] text-white" : "border-[#dfe9df] bg-white text-[#52695b] hover:border-[#69a653]"}`}>{item}</button>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-[#173d2b]">All Articles</h2><span className="text-xs text-[#849289]">{filtered.length} results</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visiblePosts.map((post, index) => {
              const image = post.featuredImage || fallbackImages[(page * pageSize + index) % fallbackImages.length];
              return <article key={post.id} className="overflow-hidden rounded-xl border border-[#e3ebe2] bg-white shadow-[0_6px_18px_rgba(20,67,43,0.05)]">
                <div className="relative aspect-[1.55] bg-[#eef6eb]"><Image src={image} alt={post.title} fill sizes="(max-width: 1024px) 50vw, 220px" className="object-cover" /></div>
                <div className="p-3"><div className="flex items-center justify-between gap-2"><Badge tone={post.status === "PUBLISHED" ? "success" : "neutral"}>{post.category ?? "Uncategorized"}</Badge><span className="text-[10px] text-[#849289]">{post.status}</span></div><h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#315b45]">{post.title}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#718177]">{post.excerpt}</p><div className="mt-3 flex items-center gap-2 text-[10px] text-[#849289]"><CalendarDays className="h-3 w-3" />{formatDate(post.publishedAt ?? post.createdAt)}<span>•</span>{readingTime(post.content)} min read</div><div className="mt-3 flex items-center justify-between"><Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-[#4f9c42] hover:underline">Read More <ArrowRight className="inline h-3 w-3" /></Link><div className="flex gap-2"><Link href={`/admin/blog/${post.id}`} aria-label={`Edit ${post.title}`} className="text-[#4f9c42]"><Pencil className="h-3.5 w-3.5" /></Link><button type="button" onClick={() => void handleDelete(post)} aria-label={`Delete ${post.title}`} className="text-[#d05c55]"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>
              </article>;
            })}
          </div>
          {visiblePosts.length === 0 && <div className="rounded-xl border border-dashed border-[#cbdcc8] bg-white p-10 text-center text-sm text-[#718177]">No blog posts match these filters.</div>}
          <div className="mt-4 flex items-center justify-between text-xs text-[#849289]"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} blogs</span><div className="flex items-center gap-1"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md p-1.5 hover:bg-[#edf8e7] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="rounded-md bg-[#4f9c42] px-2 py-1 text-white">{page}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md p-1.5 hover:bg-[#edf8e7] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-[#e3ebe2] bg-white p-4 shadow-[0_6px_18px_rgba(20,67,43,0.05)]"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold text-[#173d2b]">Popular Posts</h2><Link href="/blog" className="text-[10px] font-semibold text-[#4f9c42]">View All →</Link></div><div className="mt-3 space-y-3">{popularPosts.map((post, index) => <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-2.5 border-b border-[#edf2eb] pb-3 last:border-0 last:pb-0"><div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-[#edf8e7]"><Image src={post.featuredImage || fallbackImages[index % fallbackImages.length]} alt="" fill sizes="56px" className="object-cover" /></div><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold leading-4 text-[#315b45]">{post.title}</p><p className="mt-1 text-[10px] text-[#849289]">{formatDate(post.publishedAt ?? post.createdAt)} · {post.status.toLowerCase()}</p></div></Link>)}</div></section>
          <section className="relative min-h-[145px] overflow-hidden rounded-xl bg-[#0b4d2c] p-4 text-white"><Image src="/images/05_seedling_fertile_soil.jpg" alt="" fill sizes="280px" className="object-cover opacity-35" /><div className="relative z-10"><p className="text-[10px] uppercase tracking-[0.2em] text-[#bde7a5]">ADHYANTHA</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight">Better Soil<br />Better Tomorrow</h2><Link href="/products" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white">Explore Products <ArrowRight className="h-3 w-3" /></Link></div><div className="absolute inset-0 bg-gradient-to-r from-[#0b4d2c] via-[#0b4d2c]/70 to-transparent" /></section>
          <section className="rounded-xl border border-[#e3ebe2] bg-white p-4 shadow-[0_6px_18px_rgba(20,67,43,0.05)]"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold text-[#173d2b]">Recent Comments</h2><span className="text-[10px] text-[#849289]">View All →</span></div><div className="mt-4 flex flex-col items-center gap-2 py-4 text-center text-xs text-[#849289]"><MessageCircle className="h-6 w-6 text-[#a9c6a1]" /><p>Blog comments are not available in the current database.</p></div></section>
        </aside>
      </div>
    </div>
  );
}
