import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, MapPin } from "lucide-react";
import { OrderTimeline } from "@/components/order/order-timeline";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import { SHIPMENT_STATUS_LABELS } from "@/types";

export default async function TrackOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) notFound();

  const shipping = order.shippingSnapshot as { fullName: string; line1: string; city: string; state: string; pincode: string };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-stone)]">Tracking Order</p>
            <h1 className="font-display text-2xl font-medium sm:text-3xl">{order.orderNumber}</h1>
          </div>
          <Link href="/products" className="text-sm font-medium text-[var(--color-canopy)] hover:underline">
            Continue Shopping
          </Link>
        </div>

        {order.trackingNumber && (
          <div className="mt-5 flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-parchment-deep)] p-4">
            <Truck className="h-5 w-5 text-[var(--color-canopy)]" />
            <div>
              <p className="text-xs text-[var(--color-stone)]">
                {order.shippingProvider ?? "Courier"} · AWB / Tracking Number
              </p>
              <p className="font-medium">{order.trackingNumber}</p>
            </div>
            <Badge tone="info" className="ml-auto">{SHIPMENT_STATUS_LABELS[order.shipmentStatus]}</Badge>
          </div>
        )}

        <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <OrderTimeline currentStatus={order.orderStatus} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-[var(--color-stone)]" /> Delivery Address
            </p>
            <p className="text-sm text-[var(--color-stone)]">
              {shipping.fullName}<br />{shipping.line1}, {shipping.city}, {shipping.state} {shipping.pincode}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="mb-2 text-sm font-medium">Order Summary</p>
            <p className="text-sm text-[var(--color-stone)]">
              {order.items.length} item(s) · Placed {formatDate(order.createdAt)}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{formatINR(order.totalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
