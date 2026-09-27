"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, MapPin, CreditCard, Truck, User as UserIcon, Printer } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { formatDateTime, formatINR, formatOrderNumber } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";

interface FullOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  user: { name: string | null; email: string; phone: string | null } | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingSnapshot: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  items: { id: string; productName: string; weightLabel: string; unitPrice: number; quantity: number; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: "ONLINE" | "COD";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shipmentStatus: ShipmentStatus;
  shippingProvider: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  coupon: { code: string } | null;
  statusHistory: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const [orderStatus, setOrderStatus] = useState<OrderStatus>("NEW");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>("NOT_CREATED");
  const [provider, setProvider] = useState("");
  const [tracking, setTracking] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/orders/${id}`);
    const data = await res.json();
    const o: FullOrder = data.order;
    setOrder(o);
    setOrderStatus(o.orderStatus);
    setPaymentStatus(o.paymentStatus);
    setShipmentStatus(o.shipmentStatus);
    setProvider(o.shippingProvider ?? "");
    setTracking(o.trackingNumber ?? "");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus,
          paymentStatus,
          shipmentStatus,
          shippingProvider: provider,
          trackingNumber: tracking,
        }),
      });
      if (res.ok) {
        show("Order updated");
        load();
      } else {
        show("Couldn't update the order", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!order) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">{formatOrderNumber(order.orderNumber)}</h1>
          <p className="text-sm text-[var(--color-stone)]">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Label
          </Button>
          <Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Panel title="Items" icon={Package}>
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-2.5 text-sm">
                  <span>{item.productName} <span className="text-[var(--color-stone)]">({item.weightLabel}) × {item.quantity}</span></span>
                  <span className="font-medium">{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              {order.discountAmount > 0 && (
                <Row label={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`} value={`− ${formatINR(order.discountAmount)}`} />
              )}
              <Row label="Shipping" value={order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)} />
              <Row label="Total" value={formatINR(order.totalAmount)} bold />
            </div>
          </Panel>

          <Panel title="Customer & Shipping Address" icon={MapPin}>
            <p className="text-sm">
              <UserIcon className="mr-1.5 inline h-3.5 w-3.5 text-[var(--color-stone)]" />
              {order.user?.name ?? order.guestName} ({order.user ? "Registered" : "Guest"}) — {order.user?.email ?? order.guestEmail}
            </p>
            <p className="mt-2 text-sm text-[var(--color-stone)]">
              {order.shippingSnapshot.fullName} — {order.shippingSnapshot.phone}<br />
              {order.shippingSnapshot.line1}{order.shippingSnapshot.line2 ? `, ${order.shippingSnapshot.line2}` : ""}<br />
              {order.shippingSnapshot.city}, {order.shippingSnapshot.state} {order.shippingSnapshot.pincode}
            </p>
          </Panel>

          {order.statusHistory.length > 0 && (
            <Panel title="Status History" icon={Truck}>
              <div className="flex flex-col gap-2">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="flex justify-between text-sm">
                    <span>{ORDER_STATUS_LABELS[h.status]}{h.note ? ` — ${h.note}` : ""}</span>
                    <span className="text-[var(--color-stone)]">{formatDateTime(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Payment" icon={CreditCard}>
            <p className="text-sm text-[var(--color-stone)]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <Select className="mt-3" label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Panel>

          <Panel title="Order Status" icon={Package}>
            <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Panel>

          <Panel title="Shipment" icon={Truck}>
            <div className="flex flex-col gap-3">
              <Input label="Shipping Provider / Courier" placeholder="e.g. Delhivery, Shiprocket" value={provider} onChange={(e) => setProvider(e.target.value)} />
              <Input label="Tracking / AWB Number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              <Select label="Shipment Status" value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value as ShipmentStatus)}>
                {Object.entries(SHIPMENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          </Panel>

          <Button size="lg" onClick={handleSave} isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="print-label">
        <div className="print-label-content">
          <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
            <div>
              <Image
                src="/images/brand/logo-lockup.png"
                alt="ADHYANTHA Goat Manure"
                width={2200}
                height={700}
                className="print-label-logo"
              />
              <p className="mt-1 text-2xl font-bold">SHIP TO</p>
            </div>
            <p className="text-right text-sm font-semibold">Order {formatOrderNumber(order.orderNumber)}</p>
          </div>
          <div className="py-5 text-lg leading-relaxed">
            <p className="text-2xl font-bold">{order.shippingSnapshot.fullName}</p>
            <p>{order.shippingSnapshot.phone}</p>
            <p className="text-base">{order.user?.email ?? order.guestEmail ?? ""}</p>
            <p>{order.shippingSnapshot.line1}</p>
            {order.shippingSnapshot.line2 && <p>{order.shippingSnapshot.line2}</p>}
            <p>{order.shippingSnapshot.city}, {order.shippingSnapshot.state}</p>
            <p className="text-2xl font-bold">{order.shippingSnapshot.pincode}</p>
          </div>
          <div className="border-t-2 border-black py-4">
            <p className="text-xs font-bold uppercase tracking-wider">Order Items</p>
            <div className="mt-2 space-y-1 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span>{item.productName} · {item.weightLabel} × {item.quantity}</span>
                  <span className="shrink-0 font-semibold">{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-black pt-2 text-base font-bold">
              <span>Total · {PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              <span>{formatINR(order.totalAmount)}</span>
            </div>
          </div>
          <div className="border-t-2 border-black pt-4">
            <p className="text-xs font-bold uppercase tracking-wider">{order.shippingProvider || "Courier"} · Tracking ID</p>
            <p className="mt-1 text-xl font-bold">{order.trackingNumber || "Not assigned"}</p>
            <Code128Barcode value={order.trackingNumber || formatOrderNumber(order.orderNumber)} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

function Code128Barcode({ value }: { value: string }) {
  const text = value.replace(/[^\x20-\x7e]/g, "?").slice(0, 40);
  const codes = [104, ...Array.from(text, (character) => character.charCodeAt(0) - 32)];
  const checksum = codes.reduce((sum, code, index) => sum + code * (index || 1), 0) % 103;
  const pattern = `${codes.map((code) => CODE128_PATTERNS[code]).join("")}${CODE128_PATTERNS[checksum]}${CODE128_PATTERNS[106]}`;
  let x = 8;
  const bars: { x: number; width: number; key: number }[] = [];

  pattern.split("").forEach((width, index) => {
    const barWidth = Number(width) * 2;
    if (index % 2 === 0) bars.push({ x, width: barWidth, key: index });
    x += barWidth;
  });

  return (
    <svg className="mt-3 h-20 w-full" viewBox={`0 0 ${x + 8} 80`} role="img" aria-label={`Barcode for ${value}`}>
      {bars.map((bar) => <rect key={bar.key} x={bar.x} y="0" width={bar.width} height="58" fill="black" />)}
      <text x="50%" y="74" textAnchor="middle" fontSize="11" fontFamily="monospace">{value}</text>
    </svg>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Package; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-medium">
        <Icon className="h-4 w-4 text-[var(--color-stone)]" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-base font-semibold text-[var(--color-ink)]" : "text-[var(--color-stone)]"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
