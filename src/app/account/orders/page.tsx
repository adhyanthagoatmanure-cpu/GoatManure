import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, ChevronRight } from "lucide-react";
import { formatDate, formatINR, formatOrderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS } from "@/types";

export default async function MyOrdersPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, it will show up here."
        actionLabel="Start Shopping"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="surface glass-lift flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] p-4 sm:p-5"
        >
          <div>
            <p className="font-semibold">{formatOrderNumber(order.orderNumber)}</p>
            <p className="text-sm text-[var(--color-stone)]">
              {formatDate(order.createdAt)} · {order.items.length} item(s) · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge>
            <span className="font-display text-base font-semibold">{formatINR(order.totalAmount)}</span>
            <ChevronRight className="h-4 w-4 text-[var(--color-stone)]" aria-hidden />
          </div>
        </Link>
      ))}
    </div>
  );
}
