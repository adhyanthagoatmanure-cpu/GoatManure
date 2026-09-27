"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { couponSchema, type CouponInput } from "@/lib/validations/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate } from "@/lib/utils";

interface Coupon extends CouponInput {
  id: string;
  timesUsed: number;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const { show } = useToast();

  async function load() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(c: Coupon) {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon? If it's been used, it will be disabled instead.")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      show("Coupon removed");
      load();
    }
  }

  if (coupons === null) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium">Coupons</h1>
        {!showForm && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        )}
      </div>

      {showForm && (
        <CouponForm
          initial={editing ?? undefined}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-parchment-deep)]/50 text-left text-xs uppercase tracking-wide text-[var(--color-stone)]">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-[var(--color-bronze)]" /> {c.code}</span>
                </td>
                <td className="px-4 py-3">{c.discountType === "FIXED" ? `₹${c.value} flat` : `${c.value}%`}</td>
                <td className="px-4 py-3 text-[var(--color-stone)]">₹{c.minOrderAmount}</td>
                <td className="px-4 py-3 text-[var(--color-stone)]">{c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3 text-[var(--color-stone)]">{c.expiresAt ? formatDate(c.expiresAt) : "No expiry"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(c)}>
                    <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className="text-[var(--color-canopy)] hover:underline"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-[var(--color-error)] hover:underline">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-8 text-center text-sm text-[var(--color-stone)]">No coupons yet.</p>}
      </div>
    </div>
  );
}

function CouponForm({ initial, onDone, onCancel }: { initial?: Coupon; onDone: () => void; onCancel: () => void }) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: initial ?? {
      discountType: "FIXED",
      value: 50,
      minOrderAmount: 0,
      perUserLimit: 1,
      isActive: true,
    },
  });

  const discountType = watch("discountType");

  async function onSubmit(values: CouponInput) {
    const res = await fetch(initial ? `/api/admin/coupons/${initial.id}` : "/api/admin/coupons", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      show(initial ? "Coupon updated" : "Coupon created");
      onDone();
    } else {
      const data = await res.json();
      show(data.error ?? "Something went wrong", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Coupon Code" placeholder="ADYA50" {...register("code")} error={errors.code?.message} />
        <Select label="Discount Type" {...register("discountType")}>
          <option value="FIXED">Fixed Amount (₹)</option>
          <option value="PERCENTAGE">Percentage (%)</option>
        </Select>
        <Input
          label={discountType === "FIXED" ? "Discount Amount (₹)" : "Discount (%)"}
          type="number"
          {...register("value", { valueAsNumber: true })}
          error={errors.value?.message}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Input label="Minimum Order (₹)" type="number" {...register("minOrderAmount", { valueAsNumber: true })} />
        {discountType === "PERCENTAGE" && (
          <Input label="Max Discount Cap (₹, optional)" type="number" {...register("maxDiscount", { valueAsNumber: true })} />
        )}
        <Input label="Total Usage Limit (optional)" type="number" {...register("usageLimit", { valueAsNumber: true })} />
        <Input label="Per-User Limit" type="number" {...register("perUserLimit", { valueAsNumber: true })} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label="Start Date (optional)" type="date" {...register("startsAt")} />
        <Input label="Expiry Date (optional)" type="date" {...register("expiresAt")} />
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("isActive")} /> Active
      </label>
      <div className="mt-5 flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>{initial ? "Save Changes" : "Create Coupon"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
