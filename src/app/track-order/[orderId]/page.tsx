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
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Tracking Order</p>
            <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{order.orderNumber}</h1>
          </div>
          <Link href="/products" className="text-sm font-semibold text-canopy underline-offset-4 hover:underline">
            Continue Shopping
          </Link>
        </div>

        {order.trackingNumber && (
          <div className="surface mt-5 flex items-center gap-3 rounded-[var(--radius-md)] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-sage text-canopy ring-1 ring-inset ring-canopy/10">
              <Truck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-stone">
                {order.shippingProvider ?? "Courier"} · AWB / Tracking Number
              </p>
              <p className="font-medium">{order.trackingNumber}</p>
            </div>
            <Badge tone="info" className="ml-auto">{SHIPMENT_STATUS_LABELS[order.shipmentStatus]}</Badge>
          </div>
        )}

        <div className="glass-strong mt-8 rounded-[var(--radius-lg)] p-6 sm:p-8">
          <OrderTimeline currentStatus={order.orderStatus} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="surface rounded-[var(--radius-md)] p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-leaf" aria-hidden /> Delivery Address
            </p>
            <p className="text-sm text-stone">
              {shipping.fullName}<br />{shipping.line1}, {shipping.city}, {shipping.state} {shipping.pincode}
            </p>
          </div>
          <div className="surface rounded-[var(--radius-md)] p-5">
            <p className="mb-2 text-sm font-semibold">Order Summary</p>
            <p className="text-sm text-stone">
              {order.items.length} item(s) · Placed {formatDate(order.createdAt)}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{formatINR(order.totalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
