import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate, formatOrderNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types";

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) notFound();

  const shipping = order.shippingSnapshot as {
    fullName: string; line1: string; line2?: string; city: string; state: string; pincode: string;
  };
  const customerName = order.user?.name ?? order.guestName ?? shipping.fullName;

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
          <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-medium sm:text-4xl">Order Placed Successfully!</h1>
        <p className="mt-2 text-[var(--color-stone)]">
          Thank you, {customerName}. Your order has been confirmed.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-5">
          <div>
            <p className="text-xs text-[var(--color-stone)]">Order ID</p>
            <p className="font-display text-lg font-semibold">{formatOrderNumber(order.orderNumber)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-stone)]">Order Date</p>
            <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] py-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} <span className="text-[var(--color-stone)]">({item.weightLabel}) × {item.quantity}</span>
              </span>
              <span className="font-medium">{formatINR(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-[var(--color-border)] py-5 text-sm">
          <div className="flex justify-between text-[var(--color-stone)]">
            <span>Subtotal</span><span>{formatINR(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--color-success)]">
              <span>Discount</span><span>− {formatINR(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--color-stone)]">
            <span>Shipping</span><span>{order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between pt-1 font-display text-base font-semibold text-[var(--color-ink)]">
            <span>Total</span><span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>

        <div className="grid gap-5 pt-5 sm:grid-cols-2">
          <div className="flex gap-2.5">
            <CreditCard className="h-4 w-4 shrink-0 text-[var(--color-stone)]" />
            <div>
              <p className="text-xs text-[var(--color-stone)]">Payment Method</p>
              <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} className="mt-1.5">
                {order.paymentStatus.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--color-stone)]" />
            <div>
              <p className="text-xs text-[var(--color-stone)]">Delivery Address</p>
              <p className="text-sm leading-relaxed">
                {shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}<br />
                {shipping.city}, {shipping.state} {shipping.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <Link href={`/track-order/${order.id}`} className="flex-1">
          <Button size="lg" className="w-full">
            <Package className="h-4 w-4" /> Track Order
          </Button>
        </Link>
        <Link href="/products" className="flex-1">
          <Button size="lg" variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
