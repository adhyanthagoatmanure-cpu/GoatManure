"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Eye, FileDown,
  FileSpreadsheet, FileText, MapPin, MessageSquare, Package, Phone, Printer, Search, ShoppingCart, Truck, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { cn, formatDate, formatINR, formatOrderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@prisma/client";
import {
  AdminPageHeader, FIELD, ICON_BUTTON, PANEL, PANEL_GLASS, TABLE_HEAD, TBODY, TD, TH, TR,
} from "@/components/admin/admin-ui";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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

/** [counts key, label, icon, icon-chip tint, status filter the tile applies]. The filter values are the same ones the old inline ternary produced. */
const summary = [
  ["total", "Total Orders", ShoppingCart, "bg-sage text-canopy", ""],
  ["confirmed", "Confirmed", Check, "bg-sage text-canopy", "CONFIRMED"],
  ["pending", "Pending", CalendarDays, "bg-bronze/10 text-bronze-dark", "NEW"],
  ["processing", "Processing", Package, "bg-gold/20 text-gold-dark", "PROCESSING"],
  ["delivered", "Delivered", Check, "bg-success-bg text-success", "DELIVERED"],
  ["cancelled", "Cancelled", X, "bg-error-bg text-error", "CANCELLED"],
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [counts, setCounts] = useState<Counts>({ total: 0, confirmed: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("CONFIRMED");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Detail | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showExportOptions, setShowExportOptions] = useState(false);
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

  function exportOrders(format: "pdf" | "excel") {
    if (!orders?.length) return;
    const date = new Date().toISOString().slice(0, 10);
    const rows = orders.map((order) => ({
      "Order ID": formatOrderNumber(order.orderNumber),
      Customer: order.user?.name ?? order.guestName ?? "Guest",
      Email: order.user?.email ?? order.guestEmail ?? "",
      Phone: order.user?.phone ?? order.guestPhone ?? "",
      "Order Date": formatDate(order.createdAt),
      "Item Count": order.items.length,
      "Total Amount": order.totalAmount,
      "Order Status": ORDER_STATUS_LABELS[order.orderStatus],
      "Payment Method": PAYMENT_METHOD_LABELS[order.paymentMethod],
      "Payment Status": PAYMENT_STATUS_LABELS[order.paymentStatus],
    }));

    try {
      if (format === "excel") {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, `adhyantha-orders-${date}.xlsx`);
      } else {
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const columns = [
          { title: "Order ID", x: 10, width: 28 },
          { title: "Customer", x: 39, width: 37 },
          { title: "Phone", x: 77, width: 28 },
          { title: "Date", x: 106, width: 27 },
          { title: "Items", x: 134, width: 12 },
          { title: "Amount", x: 147, width: 27 },
          { title: "Status", x: 175, width: 30 },
          { title: "Payment", x: 206, width: 24 },
          { title: "Pay status", x: 231, width: 27 },
        ];
        let y = 16;
        const drawHeader = () => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          columns.forEach(({ title, x }) => pdf.text(title, x, y));
          y += 6;
          pdf.setFont("helvetica", "normal");
        };
        pdf.setFontSize(14);
        pdf.text("ADHYANTHA Order Details", 10, y);
        pdf.setFontSize(8);
        pdf.text(`Exported: ${new Date().toLocaleDateString("en-IN")}`, 10, y + 5);
        y += 14;
        drawHeader();
        orders.forEach((order) => {
          if (y > 195) {
            pdf.addPage();
            y = 16;
            drawHeader();
          }
          const values = [
            formatOrderNumber(order.orderNumber),
            order.user?.name ?? order.guestName ?? "Guest",
            order.user?.phone ?? order.guestPhone ?? "-",
            formatDate(order.createdAt),
            String(order.items.length),
            formatINR(order.totalAmount),
            ORDER_STATUS_LABELS[order.orderStatus],
            PAYMENT_METHOD_LABELS[order.paymentMethod],
            PAYMENT_STATUS_LABELS[order.paymentStatus],
          ];
          values.forEach((value, index) => {
            const column = columns[index];
            pdf.text(value.slice(0, Math.max(1, Math.floor(column.width / 1.8))), column.x, y);
          });
          y += 6;
        });
        pdf.save(`adhyantha-orders-${date}.pdf`);
      }
    } catch {
      window.alert(`Unable to export orders as ${format === "excel" ? "Excel" : "PDF"}. Please try again.`);
    } finally {
      setShowExportOptions(false);
    }
  }

  if (orders === null) return <PageSpinner />;
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const visibleOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleOrdersSelected =
    visibleOrders.length > 0 && visibleOrders.every((order) => selectedOrderIds.includes(order.id));
  const selectedStatusLabel = selected ? ORDER_STATUS_LABELS[selected.orderStatus] : "";

  function toggleVisibleOrders(checked: boolean) {
    const visibleIds = new Set(visibleOrders.map((order) => order.id));
    setSelectedOrderIds((current) => {
      const remaining = current.filter((id) => !visibleIds.has(id));
      return checked ? [...remaining, ...visibleIds] : remaining;
    });
  }

  function toggleOrder(orderId: string, checked: boolean) {
    setSelectedOrderIds((current) =>
      checked
        ? current.includes(orderId) ? current : [...current, orderId]
        : current.filter((id) => id !== orderId)
    );
  }

  function printSelectedOrders() {
    const params = new URLSearchParams({ ids: selectedOrderIds.join(",") });
    window.location.assign(`/admin/orders/print?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader icon={ShoppingCart} title="Orders" description="View and manage all customer orders." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map(([key, label, Icon, tint, filter]) => {
          const active = status === filter;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => { setStatus(filter); void load({ status: filter }); }}
              className={cn(PANEL_GLASS, "glass-lift relative flex min-w-0 items-center gap-3 overflow-hidden px-3 py-2.5 text-left")}
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", tint)}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-stone">{label}</span>
                <span className="block font-display text-xl font-semibold leading-tight text-ink">{counts[key as keyof Counts]}</span>
              </span>
              {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-canopy" />}
            </button>
          );
        })}
      </div>

      <div className={cn(PANEL, "flex flex-col gap-3 p-4 xl:flex-row xl:items-center")}>
        <form
          onSubmit={(event) => { event.preventDefault(); void load(); }}
          className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3.5 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15"
        >
          <Search className="h-4 w-4 shrink-0 text-stone" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Order ID, Customer Name or Phone..."
            aria-label="Search orders"
            className="w-full bg-transparent text-sm text-ink placeholder:text-stone-light focus:outline-none"
          />
        </form>
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); void load({ status: event.target.value }); }}
          aria-label="Filter by order status"
          className={cn(FIELD, "xl:w-44")}
        >
          <option value="CONFIRMED">Confirmed</option>
          <option value="">All Status</option>
          <option value="NEW">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <div className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" className="min-w-0 bg-transparent text-xs text-ink focus:outline-none" />
          <span className="text-stone" aria-hidden>–</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" className="min-w-0 bg-transparent text-xs text-ink focus:outline-none" />
        </div>
        <Button onClick={() => void load()} variant="outline"><CalendarDays className="h-4 w-4" aria-hidden />Apply</Button>
        <Button onClick={() => setShowExportOptions(true)} disabled={!orders.length}>
          <FileDown className="h-4 w-4" aria-hidden />Export
        </Button>
        <Button onClick={printSelectedOrders} disabled={selectedOrderIds.length === 0}>
          <Printer className="h-4 w-4" aria-hidden />
          Print selected ({selectedOrderIds.length})
        </Button>
      </div>

      {showExportOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowExportOptions(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-export-title"
            className={cn(PANEL, "w-full max-w-sm space-y-4 p-5")}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 id="order-export-title" className="font-display text-lg font-semibold text-ink">Export orders</h2>
              <p className="mt-1 text-sm text-stone">Choose a format for the currently filtered orders.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => exportOrders("pdf")}>
                <FileText className="h-4 w-4" aria-hidden />Export as PDF
              </Button>
              <Button type="button" variant="outline" onClick={() => exportOrders("excel")}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden />Export as Excel
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowExportOptions(false)}>Cancel</Button>
            </div>
          </section>
        </div>
      )}

      <div className={cn("grid gap-5", selected && "xl:grid-cols-[minmax(0,1fr)_380px]")}>
        <section className={cn(PANEL, "min-w-0 overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <caption className="sr-only">Customer orders</caption>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TH}>
                    <input
                      type="checkbox"
                      aria-label="Select all orders on this page"
                      checked={allVisibleOrdersSelected}
                      onChange={(event) => toggleVisibleOrders(event.target.checked)}
                      className="h-4 w-4 accent-canopy"
                    />
                  </th>
                  {["#", "Order ID", "Customer", "Date & Time", "Amount", "Status", "Payment", "Action"].map((head) => (
                    <th key={head} scope="col" className={TH}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={TBODY}>
                {visibleOrders.map((order, index) => (
                  <tr key={order.id} className={TR}>
                    <td className={TD}>
                      <input
                        type="checkbox"
                        aria-label={`Select order ${formatOrderNumber(order.orderNumber)}`}
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(event) => toggleOrder(order.id, event.target.checked)}
                        className="h-4 w-4 accent-canopy"
                      />
                    </td>
                    <td className={cn(TD, "text-xs text-stone")}>{(page - 1) * pageSize + index + 1}</td>
                    <td className={TD}>
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-canopy underline-offset-4 hover:underline">
                        {formatOrderNumber(order.orderNumber)}
                      </Link>
                      <p className="mt-1 text-xs text-stone">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className={TD}>
                      <p className="font-medium text-ink">{order.user?.name ?? order.guestName ?? "Guest"}</p>
                      <p className="mt-1 text-xs text-stone">{order.user?.phone ?? order.guestPhone ?? order.user?.email ?? order.guestEmail ?? "—"}</p>
                    </td>
                    <td className={cn(TD, "text-xs text-stone")}>
                      <p>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.createdAt))}</p>
                      <p className="mt-1">{new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</p>
                    </td>
                    <td className={cn(TD, "font-semibold text-ink")}>{formatINR(order.totalAmount)}</td>
                    <td className={TD}><Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge></td>
                    <td className={TD}>
                      <p className="text-xs font-medium text-ink">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                      <p className="mt-1 text-xs text-stone">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
                    </td>
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => void openDetails(order.id)}
                        aria-label={`View order ${formatOrderNumber(order.orderNumber)}`}
                        className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-sm)] bg-sage px-3 text-xs font-semibold text-canopy transition-colors hover:bg-sage-deep sm:h-9"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleOrders.length === 0 && <p className="p-12 text-center text-sm text-stone">No orders found for the selected filters.</p>}
          <div className="flex flex-col justify-between gap-3 border-t border-border px-4 py-3 text-xs text-stone sm:flex-row sm:items-center">
            <span>Showing {orders.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, orders.length)} of {orders.length} orders</span>
            <nav aria-label="Orders pagination" className="flex items-center gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className={cn(ICON_BUTTON, "disabled:opacity-40")} aria-label="Previous page"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
              <span className="px-2 font-medium text-ink">{page} / {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className={cn(ICON_BUTTON, "disabled:opacity-40")} aria-label="Next page"><ChevronRight className="h-4 w-4" aria-hidden /></button>
            </nav>
          </div>
        </section>

        {selected && <OrderDetailsPanel order={selected} statusLabel={selectedStatusLabel} onClose={() => setSelected(null)} onUpdateStatus={updateStatus} />}
      </div>
    </div>
  );
}

const SECTION = "border-t border-border pt-4";
const LABEL = "text-xs font-semibold uppercase tracking-wider text-stone";

function OrderDetailsPanel({ order, statusLabel, onClose, onUpdateStatus }: { order: Detail; statusLabel: string; onClose: () => void; onUpdateStatus: (id: string, status: string) => Promise<void> }) {
  const customerName = order.user?.name ?? order.guestName ?? "Guest";
  const phone = order.user?.phone ?? order.guestPhone ?? "";
  const email = order.user?.email ?? order.guestEmail ?? "";
  const nextStatus =
    order.orderStatus === "NEW" || order.orderStatus === "CONFIRMED"
      ? "PROCESSING"
      : order.orderStatus === "PROCESSING"
        ? "DELIVERED"
        : null;
  return (
    <aside aria-label="Order details" className={cn(PANEL, "overflow-hidden xl:sticky xl:top-4 xl:max-h-[calc(100vh-110px)] xl:overflow-y-auto")}>
      <div data-on-dark className="bg-canopy-dark p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-white/15"><Package className="h-5 w-5" aria-hidden /></span>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Order Details</h2>
              <p className="mt-0.5 text-xs text-sage-deep">{statusLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-white/10 sm:h-9 sm:w-9" aria-label="Close order details"><X className="h-4 w-4" aria-hidden /></button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-stone">Order ID</p><p className="mt-1 font-semibold text-ink">{formatOrderNumber(order.orderNumber)}</p></div>
          <div><p className="text-stone">Order Date</p><p className="mt-1 font-semibold text-ink">{formatDate(order.createdAt)}</p></div>
        </div>
        <section className={SECTION}>
          <h3 className={LABEL}>Customer Information</h3>
          <p className="mt-3 font-semibold text-ink">{customerName}</p>
          <p className="mt-1 text-xs text-stone">{phone || email || "Contact details unavailable"}</p>
          <p className="mt-1 text-xs text-stone">{email}</p>
          <div className="mt-3 flex gap-2">
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] bg-sage px-3 text-xs font-semibold text-canopy transition-colors hover:bg-sage-deep sm:min-h-9"><Phone className="h-3.5 w-3.5" aria-hidden />Call</a>
            )}{" "}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-3 text-xs font-semibold text-ink transition-colors hover:bg-sage sm:min-h-9"><MessageSquare className="h-3.5 w-3.5" aria-hidden />Message</a>
            )}
          </div>
        </section>
        <section className={SECTION}>
          <h3 className={cn(LABEL, "flex items-center gap-2")}><MapPin className="h-3.5 w-3.5" aria-hidden />Shipping Address</h3>
          <p className="mt-3 text-sm leading-6 text-stone">{order.address ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}, ${order.address.country}` : "Shipping address unavailable"}</p>
        </section>
        <section className={SECTION}>
          <h3 className={LABEL}>Order Items</h3>
          <div className="mt-3 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div><p className="font-medium text-ink">{item.productName}</p><p className="mt-1 text-xs text-stone">{item.weightLabel} · Qty {item.quantity}</p></div>
                <span className="font-semibold text-ink">{formatINR(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={cn(SECTION, "text-sm")}>
          <div className="flex justify-between text-stone"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="mt-2 flex justify-between text-stone"><span>Shipping</span><span>{formatINR(order.shippingFee)}</span></div>
          {order.discountAmount > 0 && <div className="mt-2 flex justify-between text-success"><span>Discount</span><span>-{formatINR(order.discountAmount)}</span></div>}
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold text-ink"><span>Total Amount</span><span>{formatINR(order.totalAmount)}</span></div>
        </section>
        <section className={cn(SECTION, "text-xs")}>
          <h3 className={LABEL}>Payment Details</h3>
          <div className="mt-3 flex justify-between"><span className="text-stone">Method</span><span className="font-medium text-ink">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span></div>
          <div className="mt-2 flex justify-between"><span className="text-stone">Status</span><span className="font-medium text-ink">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></div>
          {order.payment?.gatewayPaymentId && <div className="mt-2 flex justify-between gap-3"><span className="text-stone">Transaction</span><span className="truncate font-medium text-ink">{order.payment.gatewayPaymentId}</span></div>}
        </section>
        <div className={cn(SECTION, "flex flex-col gap-2")}>
          {nextStatus && (
            <Button onClick={() => void onUpdateStatus(order.id, nextStatus)} className="w-full">
              <Truck className="h-4 w-4" aria-hidden />Mark as {nextStatus === "DELIVERED" ? "Delivered" : "Processing"}<ArrowRight className="ml-auto h-4 w-4" aria-hidden />
            </Button>
          )}
          {order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && (
            <Button onClick={() => void onUpdateStatus(order.id, "CANCELLED")} variant="outline" className="w-full border-error/40 text-error hover:border-error hover:bg-error-bg">
              <X className="h-4 w-4" aria-hidden />Cancel Order
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
