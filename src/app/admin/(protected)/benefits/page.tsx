"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Ellipsis, Leaf, Pencil, Plus, Search, ShieldCheck, Sprout, Trash2, X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  AdminPageHeader, FIELD, ICON_BUTTON, ICON_BUTTON_DANGER, PANEL, PANEL_GLASS, TABLE_HEAD, TBODY, TD, TH, TR,
} from "@/components/admin/admin-ui";

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
  ["100% Organic", "No chemical additives", Leaf, "bg-sage text-canopy"],
  ["Richer Soil Fertility", "Improves soil structure", Sprout, "bg-gold/20 text-gold-dark"],
  ["Higher Yield", "Supports stronger growth", Sprout, "bg-bronze/10 text-bronze-dark"],
  ["Eco Friendly", "Supports sustainable farming", Leaf, "bg-leaf/10 text-canopy-light"],
  ["Healthy Plants", "Stronger roots & resilience", ShieldCheck, "bg-sage-deep/60 text-canopy"],
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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader
        icon={Leaf}
        title="Benefits"
        description="Discover the natural benefits of our goat manure products."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> Add Benefit</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summaries.map(([heading, description, Icon, tint]) => (
          <div key={heading} className={cn(PANEL_GLASS, "p-3.5 text-center")}>
            <span className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-full", tint)}><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
            <p className="mt-2 text-sm font-semibold text-ink">{heading}</p>
            <p className="mt-1 text-xs text-stone">{description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className={cn(PANEL, "min-w-0 overflow-hidden")}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><ShieldCheck className="h-5 w-5 text-leaf" aria-hidden /> All Benefits</h2>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15 sm:h-10">
                <Search className="h-4 w-4 shrink-0 text-stone" aria-hidden />
                <span className="sr-only">Search benefits</span>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search benefits..." className="w-36 bg-transparent text-sm text-ink placeholder:text-stone-light focus:outline-none" />
              </label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category" className={cn(FIELD, "sm:h-10 sm:w-auto")}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <caption className="sr-only">Benefits</caption>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TH}>#</th>
                  <th scope="col" className={TH}>Benefit</th>
                  <th scope="col" className={TH}>Category</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={cn(TH, "text-right")}>Action</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {visible.map((item, index) => (
                  <tr key={item.id} className={TR}>
                    <td className={cn(TD, "text-stone")}>{(page - 1) * pageSize + index + 1}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-sage text-canopy"><Leaf className="h-4 w-4" aria-hidden /></span>
                        <div>
                          <p className="font-semibold text-ink">{item.title}</p>
                          <p className="mt-0.5 max-w-[330px] truncate text-xs text-stone">{item.product.shortDescription ?? `Benefit of ${item.product.name}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}><Badge tone="info">{item.product.category?.name ?? "General"}</Badge></td>
                    <td className={TD}><Badge tone={item.product.status === "ACTIVE" ? "success" : item.product.status === "DRAFT" ? "warning" : "error"}>{item.product.status}</Badge></td>
                    <td className={TD}>
                      <div className="relative flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className={ICON_BUTTON}><Pencil className="h-4 w-4" aria-hidden /></button>
                        <button type="button" onClick={() => void remove(item)} aria-label={`Delete ${item.title}`} className={ICON_BUTTON_DANGER}><Trash2 className="h-4 w-4" aria-hidden /></button>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)}
                          aria-label={`More actions for ${item.title}`}
                          aria-expanded={openMenuId === item.id}
                          className={ICON_BUTTON}
                        >
                          <Ellipsis className="h-4 w-4" aria-hidden />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-11 z-20 w-36 rounded-[var(--radius-sm)] border border-border bg-white p-1 text-left shadow-[var(--shadow-lifted)]">
                            <button type="button" onClick={() => { setOpenMenuId(null); openEdit(item); }} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm text-ink transition-colors hover:bg-sage"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</button>
                            <button type="button" onClick={() => { setOpenMenuId(null); void remove(item); }} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-sm text-error transition-colors hover:bg-error-bg"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && <p className="p-8 text-center text-sm text-stone">No benefits match your filters.</p>}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-stone">
            <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} benefits</span>
            <nav aria-label="Benefits pagination" className="flex items-center gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page" className={cn(ICON_BUTTON, "disabled:opacity-40")}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
              <span className="rounded-md bg-canopy px-2.5 py-1 font-semibold text-white" aria-current="page">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className={cn(ICON_BUTTON, "disabled:opacity-40")}><ChevronRight className="h-4 w-4" aria-hidden /></button>
            </nav>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <section className={cn(PANEL, "p-4")}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Benefits Overview</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Soil Health", "Crop Growth", "Plant Protection", "Environment"].map((label, index) => (
                <div key={label} className={cn("rounded-[var(--radius-sm)] p-3", ["bg-sage", "bg-gold/15", "bg-bronze/10", "bg-leaf/10"][index])}>
                  <p className="text-xs text-stone">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{(benefits ?? []).filter((item) => (item.product.category?.name ?? "General").toLowerCase().includes(label.split(" ")[0].toLowerCase())).length}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={cn(PANEL, "p-4")}>
            <h2 className="font-display text-base font-semibold text-ink">Top Benefits</h2>
            <div className="mt-3 space-y-3">
              {ranking.length ? ranking.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs text-stone">
                    <span className="flex items-center gap-1.5"><Leaf className="h-3 w-3 text-leaf" aria-hidden />{name}</span>
                    <span>{Math.round((count / Math.max(1, benefits.length)) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sage">
                    <div className="h-full rounded-full bg-leaf" style={{ width: `${Math.max(12, (count / Math.max(1, ranking[0][1])) * 100)}%` }} />
                  </div>
                </div>
              )) : <p className="text-xs text-stone">Add benefits to see rankings.</p>}
            </div>
          </section>
          <section className="relative isolate min-h-[160px] overflow-hidden rounded-[var(--radius-md)] bg-canopy-dark p-4 text-white shadow-[var(--shadow-soft)]">
            <Image src="/images/05_seedling_fertile_soil.jpg" alt="" fill sizes="300px" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-canopy-dark via-canopy-dark/70 to-transparent" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-sage-deep">ADHYANTHA</p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">Healthier Soil<br />Better Tomorrow</h2>
            </div>
          </section>
        </aside>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canopy-dark/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="benefit-dialog-title" className="glass-strong w-full max-w-md rounded-[var(--radius-lg)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="benefit-dialog-title" className="font-display text-xl font-semibold text-ink">{editing ? "Edit Benefit" : "Add Benefit"}</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close dialog" className={ICON_BUTTON}><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <div className="mt-4 space-y-3">
              <Input id="benefit-title" label="Benefit title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 100% Organic" />
              {!editing && (
                <Select id="benefit-product" label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </Select>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => void save()}><Check className="h-4 w-4" aria-hidden /> Save Benefit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
