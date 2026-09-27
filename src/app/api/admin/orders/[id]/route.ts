import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderStatusSchema } from "@/lib/validations/admin";
import { restockOrder } from "@/server/services/order.service";
import { createAdminNotification } from "@/server/services/admin-notification.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true, statusHistory: { orderBy: { createdAt: "asc" } }, coupon: true, payment: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const parsed = updateOrderStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const data = parsed.data;

  // Cancelling restores the stock that was reserved for this order — only
  // once, guarded by checking the previous status wasn't already cancelled.
  if (data.orderStatus === "CANCELLED" && existing.orderStatus !== "CANCELLED") {
    await restockOrder(id);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(data.orderStatus ? { orderStatus: data.orderStatus } : {}),
      ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
      ...(data.shipmentStatus ? { shipmentStatus: data.shipmentStatus } : {}),
      ...(data.shippingProvider !== undefined ? { shippingProvider: data.shippingProvider } : {}),
      ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
      ...(data.adminNote !== undefined ? { adminNote: data.adminNote } : {}),
      ...(data.orderStatus
        ? { statusHistory: { create: { status: data.orderStatus, note: data.note || undefined } } }
        : {}),
    },
  });

  if (data.orderStatus && data.orderStatus !== existing.orderStatus) {
    await createAdminNotification({
      type: "ORDER",
      title: "Order status updated",
      message: `${updated.orderNumber} is now ${data.orderStatus.replaceAll("_", " ").toLowerCase()}`,
      href: `/admin/orders/${updated.id}`,
    });
  }

  return NextResponse.json({ order: updated });
}
