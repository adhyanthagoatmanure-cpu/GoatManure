"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { formatINR } from "@/lib/utils";
import {
  AdminPageHeader, EmptyNote, ICON_BUTTON, ICON_BUTTON_DANGER, TABLE_HEAD, TBODY, TD, TH, TR, TableShell,
} from "@/components/admin/admin-ui";

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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader
        icon={Package}
        title="Products"
        description="Manage the catalogue shown on the storefront."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden /> Add Product
          </ButtonLink>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
        className="flex h-11 max-w-sm items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3.5 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15"
      >
        <Search className="h-4 w-4 shrink-0 text-stone" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full bg-transparent text-sm text-ink placeholder:text-stone-light focus:outline-none"
        />
      </form>

      <TableShell>
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Products</caption>
          <thead className={TABLE_HEAD}>
            <tr>
              <th scope="col" className={TH}>Product</th>
              <th scope="col" className={TH}>Category</th>
              <th scope="col" className={TH}>Variants</th>
              <th scope="col" className={TH}>Stock</th>
              <th scope="col" className={TH}>Status</th>
              <th scope="col" className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={TBODY}>
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className={TR}>
                  <td className={`${TD} font-medium text-ink`}>
                    {p.name}
                    {p.featured && <Badge tone="info" className="ml-2">Featured</Badge>}
                  </td>
                  <td className={`${TD} text-stone`}>{p.category?.name ?? "—"}</td>
                  <td className={`${TD} text-stone`}>
                    {p.variants.map((v) => `${v.weightLabel} (${formatINR(v.offerPrice)})`).join(", ")}
                  </td>
                  <td className={TD}>
                    <Badge tone={totalStock === 0 ? "error" : totalStock < 20 ? "warning" : "success"}>{totalStock} units</Badge>
                  </td>
                  <td className={TD}>
                    <Badge tone={p.status === "ACTIVE" ? "success" : p.status === "DRAFT" ? "neutral" : "error"}>{p.status}</Badge>
                  </td>
                  <td className={TD}>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} className={ICON_BUTTON} aria-label={`Edit ${p.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                      <button type="button" onClick={() => handleDelete(p.id)} className={ICON_BUTTON_DANGER} aria-label={`Delete ${p.name}`}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <EmptyNote>No products yet — add your first one.</EmptyNote>}
      </TableShell>
    </div>
  );
}
