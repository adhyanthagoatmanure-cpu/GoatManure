import { notFound } from "next/navigation";
import { CheckCircle2, Package, MapPin, CreditCard } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate, formatOrderNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { ClearCartOnPayUSuccess } from "@/components/checkout/clear-cart-on-payu-success";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ clearCart?: string }>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
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
    <div className="container-page py-12 sm:py-20">
      <ClearCartOnPayUSuccess enabled={query.clearCart === "1"} />
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)] ring-8 ring-[var(--color-success-bg)]/60">
          <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">Order Placed Successfully!</h1>
        <p className="mt-2 text-stone">
          Thank you, {customerName}. Your order has been confirmed.
        </p>
      </div>

      {/* One frosted receipt card; the rows inside stay plain for legibility. */}
      <div className="glass-strong mx-auto mt-10 max-w-2xl rounded-[var(--radius-lg)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Order ID</p>
            <p className="font-display text-lg font-semibold">{formatOrderNumber(order.orderNumber)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Order Date</p>
            <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-border py-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.productName} <span className="whitespace-nowrap text-stone">({item.weightLabel}) × {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">{formatINR(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-border py-5 text-sm">
          <div className="flex justify-between text-stone">
            <span>Subtotal</span><span>{formatINR(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--color-success)]">
              <span>Discount</span><span>− {formatINR(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-stone">
            <span>Shipping</span><span>{order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between pt-1 font-display text-base font-semibold text-ink">
            <span>Total</span><span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>

        <div className="grid gap-5 pt-5 sm:grid-cols-2">
          <div className="flex gap-2.5">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone">Payment Method</p>
              <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} className="mt-1.5">
                {order.paymentStatus.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone">Delivery Address</p>
              <p className="text-sm leading-relaxed">
                {shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}<br />
                {shipping.city}, {shipping.state} {shipping.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/track-order/${order.id}`} size="lg" className="flex-1">
          <Package className="h-4 w-4" aria-hidden /> Track Order
        </ButtonLink>
        <ButtonLink href="/products" size="lg" variant="outline" className="flex-1">
          Continue Shopping
        </ButtonLink>
      </div>
    </div>
  );
}
