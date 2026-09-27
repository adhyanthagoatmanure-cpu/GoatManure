"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Ellipsis, Leaf, Pencil, Plus, Search, ShieldCheck, Sprout, Trash2,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";

type Benefit = {
  id: string;
  title: string;
  icon: string | null;
  product: {
    id: string;
    name: string;
    shortDescription: string | null;
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
    category: { name: string } | null;
  };
};
type ProductOption = { id: string; name: string };

const summaries = [
  ["100% Organic", "No chemical additives", Leaf, "bg-[#edf8e7]"],
  ["Richer Soil Fertility", "Improves soil structure", Sprout, "bg-[#fff7e8]"],
  ["Higher Yield", "Supports stronger growth", Sprout, "bg-[#fdf0ed]"],
  ["Eco Friendly", "Supports sustainable farming", Leaf, "bg-[#eaf6f8]"],
  ["Healthy Plants", "Stronger roots & resilience", ShieldCheck, "bg-[#eef4ec]"],
] as const;

export default function AdminBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[] | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Benefit | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const { show } = useToast();
  const pageSize = 8;

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/benefits", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      show(data.error ?? "Unable to load benefits.", "error");
      return;
    }
    setBenefits(data.benefits ?? []);
    setProducts(data.products ?? []);
  }, [show]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const categories = useMemo(() => ["All Categories", ...new Set((benefits ?? []).map((item) => item.product.category?.name ?? "General"))], [benefits]);
  const filtered = useMemo(() => (benefits ?? []).filter((item) => {
    const matchesQuery = `${item.title} ${item.product.name} ${item.product.shortDescription ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All Categories" || (item.product.category?.name ?? "General") === category;
    return matchesQuery && matchesCategory;
  }), [benefits, category, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const ranking = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of benefits ?? []) counts.set(item.title, (counts.get(item.title) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [benefits]);

  function openCreate() {
    setEditing(null); setTitle(""); setProductId(products[0]?.id ?? ""); setShowForm(true);
  }
  function openEdit(item: Benefit) {
    setEditing(item); setTitle(item.title); setProductId(item.product.id); setShowForm(true);
  }
  async function save() {
    const response = await fetch(editing ? `/api/admin/benefits/${editing.id}` : "/api/admin/benefits", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, productId }),
    });
    const data = await response.json();
    if (!response.ok) { show(data.error ?? "Unable to save benefit.", "error"); return; }
    show(editing ? "Benefit updated." : "Benefit added.");
    setShowForm(false); await load();
  }
  async function remove(item: Benefit) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const response = await fetch(`/api/admin/benefits/${item.id}`, { method: "DELETE" });
    if (response.ok) { show("Benefit deleted."); await load(); } else show("Unable to delete benefit.", "error");
  }

  if (!benefits) return <PageSpinner />;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6e2] text-[#4f9c42]"><Leaf className="h-5 w-5" /></span><div><h1 className="font-display text-2xl font-semibold text-[#173d2b]">Benefits</h1><p className="text-xs text-[#6b7a70]">Discover the natural benefits of our goat manure products.</p></div></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Benefit</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {summaries.map(([heading, description, Icon, tone]) => <div key={heading} className={`rounded-xl border border-[#e3ebe2] ${tone} p-3 shadow-[0_6px_18px_rgba(20,67,43,0.04)]`}><Icon className="mx-auto h-5 w-5 text-[#4f9c42]" /><p className="mt-2 text-center text-xs font-semibold text-[#315b45]">{heading}</p><p className="mt-1 text-center text-[10px] text-[#718177]">{description}</p></div>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3ebe2] bg-white shadow-[0_8px_24px_rgba(20,67,43,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf2eb] p-4"><h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#173d2b]"><ShieldCheck className="h-5 w-5 text-[#69a653]" /> All Benefits</h2><div className="flex gap-2"><label className="flex items-center gap-2 rounded-lg border border-[#dfe9df] px-2.5 py-1.5"><Search className="h-3.5 w-3.5 text-[#849289]" /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search benefits..." className="w-36 text-xs outline-none" /></label><select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-lg border border-[#dfe9df] bg-white px-2 text-xs text-[#315b45] outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[#f8fbf7] uppercase tracking-wide text-[#849289]"><tr><th className="px-4 py-2.5">#</th><th className="px-4 py-2.5">Benefit</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#edf2eb]">{visible.map((item, index) => <tr key={item.id} className="hover:bg-[#fbfdf9]"><td className="px-4 py-3 text-[#849289]">{(page - 1) * pageSize + index + 1}</td><td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf8e7] text-[#4f9c42]"><Leaf className="h-4 w-4" /></span><div><p className="font-semibold text-[#315b45]">{item.title}</p><p className="mt-0.5 max-w-[330px] truncate text-[10px] text-[#849289]">{item.product.shortDescription ?? `Benefit of ${item.product.name}`}</p></div></div></td><td className="px-4 py-3"><Badge tone="info">{item.product.category?.name ?? "General"}</Badge></td><td className="px-4 py-3"><Badge tone={item.product.status === "ACTIVE" ? "success" : item.product.status === "DRAFT" ? "warning" : "error"}>{item.product.status}</Badge></td><td className="px-4 py-3"><div className="relative flex justify-end gap-2"><button onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="text-[#4f9c42] hover:text-[#173d2b]"><Pencil className="h-4 w-4" /></button><button onClick={() => void remove(item)} aria-label={`Delete ${item.title}`} className="text-[#d05c55] hover:text-[#a33f39]"><Trash2 className="h-4 w-4" /></button><button type="button" onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)} aria-label={`More actions for ${item.title}`} aria-expanded={openMenuId === item.id} className="text-[#849289] hover:text-[#315b45]"><Ellipsis className="h-4 w-4" /></button>{openMenuId === item.id && <div className="absolute right-0 top-6 z-20 w-32 rounded-lg border border-[#dfe9df] bg-white p-1 text-left shadow-lg"><button type="button" onClick={() => { setOpenMenuId(null); openEdit(item); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#315b45] hover:bg-[#f1f7ee]"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => { setOpenMenuId(null); void remove(item); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#d05c55] hover:bg-[#fff0ef]"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>}</div></td></tr>)}</tbody></table></div>
          {visible.length === 0 && <p className="p-8 text-center text-sm text-[#6b7a70]">No benefits match your filters.</p>}
          <div className="flex items-center justify-between border-t border-[#edf2eb] px-4 py-3 text-xs text-[#849289]"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} benefits</span><div className="flex items-center gap-1"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md p-1.5 hover:bg-[#f1f7ee] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="rounded-md bg-[#4f9c42] px-2 py-1 text-white">{page}</span><button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md p-1.5 hover:bg-[#f1f7ee] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-[#e3ebe2] bg-white p-4 shadow-[0_8px_24px_rgba(20,67,43,0.05)]"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold text-[#173d2b]">Benefits Overview</h2><span className="text-[10px] font-semibold text-[#4f9c42]">View Report →</span></div><div className="mt-3 grid grid-cols-2 gap-2">{["Soil Health", "Crop Growth", "Plant Protection", "Environment"].map((label, index) => <div key={label} className={`rounded-lg p-2.5 ${["bg-[#edf8e7]", "bg-[#fff7e8]", "bg-[#fdf0ed]", "bg-[#eaf6f8]"][index]}`}><p className="text-[10px] text-[#718177]">{label}</p><p className="mt-1 text-xl font-semibold text-[#315b45]">{(benefits ?? []).filter((item) => (item.product.category?.name ?? "General").toLowerCase().includes(label.split(" ")[0].toLowerCase())).length}</p></div>)}</div></section>
          <section className="rounded-xl border border-[#e3ebe2] bg-white p-4 shadow-[0_8px_24px_rgba(20,67,43,0.05)]"><h2 className="font-display text-base font-semibold text-[#173d2b]">Top Benefits</h2><div className="mt-3 space-y-3">{ranking.length ? ranking.map(([name, count]) => <div key={name}><div className="flex justify-between text-[10px] text-[#52695b]"><span className="flex items-center gap-1.5"><Leaf className="h-3 w-3 text-[#69a653]" />{name}</span><span>{Math.round((count / Math.max(1, benefits.length)) * 100)}%</span></div><div className="mt-1 h-1.5 rounded-full bg-[#edf2eb]"><div className="h-full rounded-full bg-[#69a653]" style={{ width: `${Math.max(12, (count / Math.max(1, ranking[0][1])) * 100)}%` }} /></div></div>) : <p className="text-xs text-[#849289]">Add benefits to see rankings.</p>}</div></section>
          <section className="relative min-h-[145px] overflow-hidden rounded-xl bg-[#0b4d2c] p-4 text-white"><Image src="/images/05_seedling_fertile_soil.jpg" alt="" fill sizes="280px" className="object-cover opacity-35" /><div className="relative z-10"><p className="text-[10px] uppercase tracking-[0.2em] text-[#bde7a5]">ADHYANTHA</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight">Healthier Soil<br />Better Tomorrow</h2></div><div className="absolute inset-0 bg-gradient-to-r from-[#0b4d2c] via-[#0b4d2c]/70 to-transparent" /></section>
        </aside>
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2b]/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-[#173d2b]">{editing ? "Edit Benefit" : "Add Benefit"}</h2><button onClick={() => setShowForm(false)} className="text-[#849289]">×</button></div><label className="mt-4 block text-xs font-medium text-[#52695b]">Benefit title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe9df] px-3 py-2 text-sm outline-none focus:border-[#69a653]" placeholder="e.g. 100% Organic" /></label>{!editing && <label className="mt-3 block text-xs font-medium text-[#52695b]">Product<select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe9df] bg-white px-3 py-2 text-sm outline-none">{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => void save()}><Check className="h-4 w-4" /> Save Benefit</Button></div></div></div>}
    </div>
  );
}
