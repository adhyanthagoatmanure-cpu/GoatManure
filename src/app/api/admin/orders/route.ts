import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q } },
            { guestName: { contains: q } },
            { guestEmail: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
          ],
        }
      : {}),
  };

  const [orders, total, confirmed, pending, processing, delivered, cancelled] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.count({ where: { ...where, orderStatus: undefined } }),
    prisma.order.count({ where: { ...where, orderStatus: "CONFIRMED" } }),
    prisma.order.count({ where: { ...where, orderStatus: "NEW" } }),
    prisma.order.count({ where: { ...where, orderStatus: { in: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] } } }),
    prisma.order.count({ where: { ...where, orderStatus: "DELIVERED" } }),
    prisma.order.count({ where: { ...where, orderStatus: "CANCELLED" } }),
  ]);

  const confirmedFirst = orders.sort((left, right) => {
    const confirmedPriority = Number(right.orderStatus === "CONFIRMED") - Number(left.orderStatus === "CONFIRMED");
    return confirmedPriority || right.createdAt.getTime() - left.createdAt.getTime();
  });

  return NextResponse.json({ orders: confirmedFirst, counts: { total, confirmed, pending, processing, delivered, cancelled } });
}
