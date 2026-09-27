import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order/order-timeline";
import { formatDate, formatINR, formatOrderNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import { Package, Truck } from "lucide-react";

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const order = await prisma.order.findFirst({
    where: { id, userId: session!.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const shipping = order.shippingSnapshot as {
    fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--color-stone)]">Order</p>
          <h2 className="font-display text-2xl font-medium">{formatOrderNumber(order.orderNumber)}</h2>
        </div>
        <Link
          href={`/track-order/${order.id}`}
          className="flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium hover:border-[var(--color-canopy)]"
        >
          <Truck className="h-4 w-4" /> Track Order
        </Link>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <OrderTimeline currentStatus={order.orderStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-medium">
            <Package className="h-4 w-4" /> Items
          </h3>
          <div className="flex flex-col divide-y divide-[var(--color-border)]">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-3 text-sm">
                <span>{item.productName} <span className="text-[var(--color-stone)]">({item.weightLabel}) × {item.quantity}</span></span>
                <span className="font-medium">{formatINR(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm font-medium">Payment</p>
            <p className="mt-1 text-sm text-[var(--color-stone)]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} className="mt-2">
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Badge>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm font-medium">Shipping Address</p>
            <p className="mt-1 text-sm text-[var(--color-stone)]">
              {shipping.fullName} — {shipping.phone}<br />
              {shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}<br />
              {shipping.city}, {shipping.state} {shipping.pincode}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
            <div className="flex justify-between text-[var(--color-stone)]"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[var(--color-success)]"><span>Discount</span><span>− {formatINR(order.discountAmount)}</span></div>
            )}
            <div className="flex justify-between text-[var(--color-stone)]"><span>Shipping</span><span>{order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</span></div>
            <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 font-display text-base font-semibold">
              <span>Total</span><span>{formatINR(order.totalAmount)}</span>
            </div>
            <p className="mt-3 text-xs text-[var(--color-stone)]">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
