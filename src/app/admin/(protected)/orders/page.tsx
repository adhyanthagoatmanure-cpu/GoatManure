"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Eye, FileDown,
  MapPin, MessageSquare, Package, Phone, Search, ShoppingCart, Truck, X, MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { formatDate, formatINR, formatOrderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@prisma/client";

type OrderRow = {
  id: string; orderNumber: string; createdAt: string;
  user: { name: string | null; email: string; phone: string | null } | null;
  guestName: string | null; guestEmail: string | null; guestPhone: string | null;
  items: { id: string }[]; totalAmount: number; paymentMethod: "ONLINE" | "COD";
  paymentStatus: keyof typeof PAYMENT_STATUS_LABELS; orderStatus: OrderStatus;
};
type Counts = { total: number; confirmed: number; pending: number; processing: number; delivered: number; cancelled: number };
type Detail = Omit<OrderRow, "items"> & {
  subtotal: number; discountAmount: number; shippingFee: number; shippingSnapshot: unknown;
  address: { fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; country: string } | null;
  items: { id: string; productName: string; weightLabel: string; quantity: number; unitPrice: number; lineTotal: number }[];
  payment: { gatewayPaymentId: string | null; gatewayOrderId: string | null } | null;
};

const summary = [
  ["total", "Total Orders", ShoppingCart, "bg-[#eef8e7]", "text-[#4f9c42]"],
  ["confirmed", "Confirmed", Check, "bg-[#eaf6e2]", "text-[#2e9b57]"],
  ["pending", "Pending", CalendarDays, "bg-[#edf6f8]", "text-[#3c8c9b]"],
  ["processing", "Processing", Package, "bg-[#fff6e5]", "text-[#d28b25]"],
  ["delivered", "Delivered", Check, "bg-[#eaf6e2]", "text-[#2e9b57]"],
  ["cancelled", "Cancelled", X, "bg-[#fff0ef]", "text-[#d05c55]"],
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [counts, setCounts] = useState<Counts>({ total: 0, confirmed: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("CONFIRMED");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Detail | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async (filters?: { query?: string; status?: string; from?: string; to?: string }) => {
    const activeQuery = filters?.query ?? query;
    const activeStatus = filters?.status ?? status;
    const activeFrom = filters?.from ?? from;
    const activeTo = filters?.to ?? to;
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    if (activeStatus) params.set("status", activeStatus);
    if (activeFrom) params.set("from", activeFrom);
    if (activeTo) params.set("to", activeTo);
    const response = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    setOrders(data.orders ?? []);
    if (data.counts) setCounts(data.counts);
    setPage(1);
  }, [from, query, status, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openDetails(id: string) {
    const response = await fetch(`/api/admin/orders/${id}`);
    if (response.ok) setSelected((await response.json()).order);
  }

  async function updateStatus(id: string, orderStatus: string) {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus }),
    });
    if (response.ok) {
      await load();
      await openDetails(id);
    }
  }

  function exportOrders() {
    if (!orders?.length) return;
    const rows = [["Order ID", "Customer", "Date", "Amount", "Status", "Payment"], ...orders.map((order) => [
      order.orderNumber, order.user?.name ?? order.guestName ?? "Guest", order.createdAt, String(order.totalAmount),
      ORDER_STATUS_LABELS[order.orderStatus], PAYMENT_METHOD_LABELS[order.paymentMethod],
    ])];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "adhyantha-orders.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (orders === null) return <PageSpinner />;
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const visibleOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const selectedStatusLabel = selected ? ORDER_STATUS_LABELS[selected.orderStatus] : "";

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6e2] text-[#4f9c42]"><ShoppingCart className="h-6 w-6" /></span>
        <div><h1 className="font-display text-3xl font-semibold text-[#173d2b]">Orders</h1><p className="mt-1 text-sm text-[#6b7a70]">View and manage all customer orders.</p></div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map(([key, label, Icon, bg, color]) => (
          <button key={key} onClick={() => { const nextStatus = key === "total" ? "" : key === "confirmed" ? "CONFIRMED" : key === "pending" ? "NEW" : key === "processing" ? "PROCESSING" : key.toUpperCase(); setStatus(nextStatus); void load({ status: nextStatus }); }} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e3ebe2] bg-white px-2.5 py-2 text-left shadow-[0_8px_24px_rgba(20,67,43,0.05)] transition hover:-translate-y-0.5 lg:px-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}><Icon className="h-3.5 w-3.5" /></span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] text-[#6b7a70]">{label}</span>
              <span className="block font-display text-lg font-semibold leading-tight text-[#173d2b]">{counts[key as keyof Counts]}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e3ebe2] bg-white p-4 shadow-[0_8px_24px_rgba(20,67,43,0.05)] xl:flex-row xl:items-center">
        <form onSubmit={(event) => { event.preventDefault(); void load(); }} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#dfe9df] bg-[#fbfdf9] px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-[#849289]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Order ID, Customer Name or Phone..." className="w-full bg-transparent text-sm outline-none" />
        </form>
        <select value={status} onChange={(event) => { setStatus(event.target.value); void load({ status: event.target.value }); }} className="rounded-xl border border-[#dfe9df] bg-[#fbfdf9] px-3 py-2.5 text-sm text-[#315b45] outline-none"><option value="CONFIRMED">Confirmed</option><option value="">All Status</option><option value="NEW">Pending</option><option value="PROCESSING">Processing</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select>
        <div className="flex items-center gap-2 rounded-xl border border-[#dfe9df] bg-[#fbfdf9] px-3 py-1.5"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" className="bg-transparent text-xs text-[#315b45] outline-none" /><span className="text-[#9aae9d]">–</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" className="bg-transparent text-xs text-[#315b45] outline-none" /></div>
        <Button onClick={() => void load()} variant="outline" className="border-[#b8d7af] text-[#315b45]"><CalendarDays className="h-4 w-4" />Apply</Button>
        <Button onClick={exportOrders} className="bg-[#0b4d2c] hover:bg-[#063d27]"><FileDown className="h-4 w-4" />Export</Button>
      </div>

      <div className={`grid gap-6 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e3ebe2] bg-white shadow-[0_8px_24px_rgba(20,67,43,0.05)]">
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-[#f2f8ef] text-left text-[11px] uppercase tracking-wider text-[#6b7a70]"><tr>{["#", "Order ID", "Customer", "Date & Time", "Amount", "Status", "Payment", "Action"].map((head) => <th key={head} className="px-4 py-3.5 font-semibold">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#edf2eb]">{visibleOrders.map((order, index) => <tr key={order.id} className="transition hover:bg-[#fbfdf9]">
              <td className="px-4 py-4 text-xs text-[#9aae9d]">{(page - 1) * pageSize + index + 1}</td>
              <td className="px-4 py-4"><button onClick={() => void openDetails(order.id)} className="font-semibold text-[#315b45] hover:text-[#4f9c42]">{formatOrderNumber(order.orderNumber)}</button><p className="mt-1 text-[11px] text-[#9aae9d]">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p></td>
              <td className="px-4 py-4"><p className="font-medium text-[#315b45]">{order.user?.name ?? order.guestName ?? "Guest"}</p><p className="mt-1 text-xs text-[#849289]">{order.user?.phone ?? order.guestPhone ?? order.user?.email ?? order.guestEmail ?? "—"}</p></td>
              <td className="px-4 py-4 text-xs text-[#6b7a70]"><p>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.createdAt))}</p><p className="mt-1">{new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</p></td>
              <td className="px-4 py-4 font-semibold text-[#173d2b]">{formatINR(order.totalAmount)}</td>
              <td className="px-4 py-4"><Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge></td>
              <td className="px-4 py-4"><p className="text-xs font-medium text-[#315b45]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p><p className="mt-1 text-[11px] text-[#849289]">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p></td>
              <td className="px-4 py-4"><div className="flex items-center gap-1"><button onClick={() => void openDetails(order.id)} className="flex items-center gap-1 rounded-lg bg-[#eaf6e2] px-2.5 py-2 text-xs font-semibold text-[#4f9c42] hover:bg-[#dff1d5]"><Eye className="h-3.5 w-3.5" />View</button><button aria-label={`More actions for ${order.orderNumber}`} className="rounded-lg p-2 text-[#849289] hover:bg-[#f2f8ef]"><MoreVertical className="h-4 w-4" /></button></div></td>
            </tr>)}</tbody></table></div>
          {visibleOrders.length === 0 && <p className="p-12 text-center text-sm text-[#6b7a70]">No orders found for the selected filters.</p>}
          <div className="flex flex-col justify-between gap-3 border-t border-[#edf2eb] px-4 py-3 text-xs text-[#849289] sm:flex-row sm:items-center"><span>Showing {orders.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, orders.length)} of {orders.length} orders</span><div className="flex items-center gap-1"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg p-2 hover:bg-[#f2f8ef] disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span className="px-2 font-medium text-[#315b45]">{page} / {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg p-2 hover:bg-[#f2f8ef] disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>

        {selected && <OrderDetailsPanel order={selected} statusLabel={selectedStatusLabel} onClose={() => setSelected(null)} onUpdateStatus={updateStatus} />}
      </div>
    </div>
  );
}

function OrderDetailsPanel({ order, statusLabel, onClose, onUpdateStatus }: { order: Detail; statusLabel: string; onClose: () => void; onUpdateStatus: (id: string, status: string) => Promise<void> }) {
  const customerName = order.user?.name ?? order.guestName ?? "Guest";
  const phone = order.user?.phone ?? order.guestPhone ?? "";
  const email = order.user?.email ?? order.guestEmail ?? "";
  const nextStatus = order.orderStatus === "NEW" ? "PROCESSING" : order.orderStatus === "PROCESSING" ? "DELIVERED" : null;
  return <aside className="overflow-hidden rounded-2xl border border-[#e3ebe2] bg-white shadow-[0_8px_24px_rgba(20,67,43,0.08)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-110px)] xl:overflow-y-auto">
    <div className="bg-[#0b4d2c] p-5 text-white"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Package className="h-5 w-5" /></span><div><h2 className="font-display text-lg font-semibold">Order Details</h2><p className="mt-1 text-xs text-[#cce8c8]">{statusLabel}</p></div></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close order details"><X className="h-4 w-4" /></button></div></div>
    <div className="space-y-5 p-5"><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-[#849289]">Order ID</p><p className="mt-1 font-semibold text-[#315b45]">{formatOrderNumber(order.orderNumber)}</p></div><div><p className="text-[#849289]">Order Date</p><p className="mt-1 font-semibold text-[#315b45]">{formatDate(order.createdAt)}</p></div></div>
      <section className="border-t border-[#edf2eb] pt-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#849289]">Customer Information</h3><p className="mt-3 font-semibold text-[#315b45]">{customerName}</p><p className="mt-1 text-xs text-[#6b7a70]">{phone || email || "Contact details unavailable"}</p><p className="mt-1 text-xs text-[#6b7a70]">{email}</p><div className="mt-3 flex gap-2">{phone && <a href={`tel:${phone}`} className="flex items-center gap-1 rounded-lg bg-[#eaf6e2] px-3 py-2 text-xs font-semibold text-[#4f9c42]"><Phone className="h-3.5 w-3.5" />Call</a>} {email && <a href={`mailto:${email}`} className="flex items-center gap-1 rounded-lg border border-[#dfe9df] px-3 py-2 text-xs font-semibold text-[#315b45]"><MessageSquare className="h-3.5 w-3.5" />Message</a>}</div></section>
      <section className="border-t border-[#edf2eb] pt-4"><h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#849289]"><MapPin className="h-3.5 w-3.5" />Shipping Address</h3><p className="mt-3 text-sm leading-6 text-[#52695b]">{order.address ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}, ${order.address.country}` : "Shipping address unavailable"}</p></section>
      <section className="border-t border-[#edf2eb] pt-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#849289]">Order Items</h3><div className="mt-3 space-y-3">{order.items.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium text-[#315b45]">{item.productName}</p><p className="mt-1 text-xs text-[#849289]">{item.weightLabel} · Qty {item.quantity}</p></div><span className="font-semibold text-[#173d2b]">{formatINR(item.lineTotal)}</span></div>)}</div></section>
      <section className="border-t border-[#edf2eb] pt-4 text-sm"><div className="flex justify-between text-[#6b7a70]"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div><div className="mt-2 flex justify-between text-[#6b7a70]"><span>Shipping</span><span>{formatINR(order.shippingFee)}</span></div>{order.discountAmount > 0 && <div className="mt-2 flex justify-between text-[#2e9b57]"><span>Discount</span><span>-{formatINR(order.discountAmount)}</span></div>}<div className="mt-3 flex justify-between border-t border-[#edf2eb] pt-3 font-semibold text-[#173d2b]"><span>Total Amount</span><span>{formatINR(order.totalAmount)}</span></div></section>
      <section className="border-t border-[#edf2eb] pt-4 text-xs"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#849289]">Payment Details</h3><div className="mt-3 flex justify-between"><span className="text-[#6b7a70]">Method</span><span className="font-medium text-[#315b45]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span></div><div className="mt-2 flex justify-between"><span className="text-[#6b7a70]">Status</span><span className="font-medium text-[#315b45]">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></div>{order.payment?.gatewayPaymentId && <div className="mt-2 flex justify-between gap-3"><span className="text-[#6b7a70]">Transaction</span><span className="truncate font-medium text-[#315b45]">{order.payment.gatewayPaymentId}</span></div>}</section>
      <div className="flex flex-col gap-2 border-t border-[#edf2eb] pt-4">{nextStatus && <Button onClick={() => void onUpdateStatus(order.id, nextStatus)} className="w-full bg-[#0b4d2c] hover:bg-[#063d27]"><Truck className="h-4 w-4" />Mark as {nextStatus === "DELIVERED" ? "Delivered" : "Processing"}<ArrowRight className="ml-auto h-4 w-4" /></Button>}{order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && <Button onClick={() => void onUpdateStatus(order.id, "CANCELLED")} variant="outline" className="w-full border-[#f0c6c3] text-[#d64545]"><X className="h-4 w-4" />Cancel Order</Button>}</div>
    </div>
  </aside>;
}
