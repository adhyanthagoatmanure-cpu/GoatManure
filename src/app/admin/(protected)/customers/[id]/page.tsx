"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Mail, Phone, Calendar, ShieldOff, ShieldCheck, IndianRupee, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { IconChip, PANEL, PANEL_GLASS } from "@/components/admin/admin-ui";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/types";
import type { OrderStatus } from "@prisma/client";

interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  orders: { id: string; orderNumber: string; createdAt: string; totalAmount: number; orderStatus: OrderStatus; items: { id: string }[] }[];
  addresses: { id: string; city: string; state: string }[];
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const { show } = useToast();

  async function load() {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    setCustomer(data.customer);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleStatus() {
    if (!customer) return;
    const next = customer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      show(next === "SUSPENDED" ? "Customer suspended" : "Customer reactivated");
      load();
    }
  }

  if (!customer) return <PageSpinner />;

  const totalSpent = customer.orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconChip icon={Users} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{customer.name ?? "Customer"}</h1>
            <Badge tone={customer.status === "ACTIVE" ? "success" : "error"} className="mt-1">{customer.status}</Badge>
          </div>
        </div>
        <Button variant={customer.status === "ACTIVE" ? "danger" : "outline"} onClick={toggleStatus}>
          {customer.status === "ACTIVE" ? <ShieldOff className="h-4 w-4" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
          {customer.status === "ACTIVE" ? "Suspend Account" : "Reactivate Account"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard icon={Mail} label="Email" value={customer.email} />
        <InfoCard icon={Phone} label="Phone" value={customer.phone ?? "—"} />
        <InfoCard icon={Calendar} label="Registered" value={formatDate(customer.createdAt)} />
        <InfoCard icon={IndianRupee} label="Total Spent" value={formatINR(totalSpent)} />
      </div>

      <div className={cn(PANEL, "p-5 sm:p-6")}>
        <h2 className="font-display text-lg font-semibold text-ink">Order History</h2>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {customer.orders.length === 0 && <p className="py-6 text-sm text-stone">No orders yet.</p>}
          {customer.orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="-mx-2 flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-3 text-sm transition-colors hover:bg-sage/40">
              <div>
                <p className="font-medium text-ink">{o.orderNumber}</p>
                <p className="text-xs text-stone">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink">{formatINR(o.totalAmount)}</span>
                <Badge tone={ORDER_STATUS_TONE[o.orderStatus]}>{ORDER_STATUS_LABELS[o.orderStatus]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className={cn(PANEL_GLASS, "p-4")}>
      <p className="flex items-center gap-1.5 text-xs text-stone"><Icon className="h-3.5 w-3.5" aria-hidden /> {label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
