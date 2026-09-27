"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { formatINR } from "@/lib/utils";

interface AdminProduct {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  featured: boolean;
  category: { name: string } | null;
  variants: { weightLabel: string; offerPrice: number; stock: number }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [query, setQuery] = useState("");
  const { show } = useToast();

  async function load(q?: string) {
    const res = await fetch(`/api/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? If it has past orders, it will be disabled instead.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      show("Product removed");
      load(query);
    }
  }

  if (products === null) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium">Products</h1>
        <Link href="/admin/products/new">
          <Button><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
        className="flex max-w-sm items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white px-3.5 py-2"
      >
        <Search className="h-4 w-4 text-[var(--color-stone)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full text-sm focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-parchment-deep)]/50 text-left text-xs uppercase tracking-wide text-[var(--color-stone)]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {p.featured && <Badge tone="info" className="ml-2">Featured</Badge>}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-stone)]">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-stone)]">
                    {p.variants.map((v) => `${v.weightLabel} (${formatINR(v.offerPrice)})`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={totalStock === 0 ? "error" : totalStock < 20 ? "warning" : "success"}>{totalStock} units</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === "ACTIVE" ? "success" : p.status === "DRAFT" ? "neutral" : "error"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/products/${p.id}`} className="text-[var(--color-canopy)] hover:underline">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="text-[var(--color-error)] hover:underline">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-8 text-center text-sm text-[var(--color-stone)]">No products yet — add your first one.</p>
        )}
      </div>
    </div>
  );
}
