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
import {
  AdminPageHeader, EmptyNote, ICON_BUTTON, ICON_BUTTON_DANGER, PANEL, TABLE_HEAD, TBODY, TD, TH, TR, TableShell,
} from "@/components/admin/admin-ui";

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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader
        icon={Tag}
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        actions={
          !showForm && (
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden /> Create Coupon
            </Button>
          )
        }
      />

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

      <TableShell>
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Coupons</caption>
          <thead className={TABLE_HEAD}>
            <tr>
              <th scope="col" className={TH}>Code</th>
              <th scope="col" className={TH}>Discount</th>
              <th scope="col" className={TH}>Min Order</th>
              <th scope="col" className={TH}>Usage</th>
              <th scope="col" className={TH}>Expires</th>
              <th scope="col" className={TH}>Status</th>
              <th scope="col" className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={TBODY}>
            {coupons.map((c) => (
              <tr key={c.id} className={TR}>
                <td className={`${TD} font-medium text-ink`}>
                  <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-bronze" aria-hidden /> {c.code}</span>
                </td>
                <td className={`${TD} text-ink`}>{c.discountType === "FIXED" ? `₹${c.value} flat` : `${c.value}%`}</td>
                <td className={`${TD} text-stone`}>₹{c.minOrderAmount}</td>
                <td className={`${TD} text-stone`}>{c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className={`${TD} text-stone`}>{c.expiresAt ? formatDate(c.expiresAt) : "No expiry"}</td>
                <td className={TD}>
                  <button
                    type="button"
                    onClick={() => handleToggle(c)}
                    aria-label={`${c.isActive ? "Disable" : "Enable"} coupon ${c.code}`}
                    className="rounded-full transition-opacity hover:opacity-80"
                  >
                    <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </button>
                </td>
                <td className={TD}>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className={ICON_BUTTON}
                      aria-label={`Edit coupon ${c.code}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => handleDelete(c.id)} className={ICON_BUTTON_DANGER} aria-label={`Delete coupon ${c.code}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <EmptyNote>No coupons yet.</EmptyNote>}
      </TableShell>
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
    <form onSubmit={handleSubmit(onSubmit)} className={`${PANEL} p-5 sm:p-6`}>
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
      <label className="mt-4 flex min-h-11 items-center gap-2.5 text-sm font-medium text-ink">
        <input type="checkbox" className="h-5 w-5 accent-canopy" {...register("isActive")} /> Active
      </label>
      <div className="mt-5 flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>{initial ? "Save Changes" : "Create Coupon"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
