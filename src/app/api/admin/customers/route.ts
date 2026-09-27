import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    },
    include: { orders: { select: { totalAmount: true } } },
    orderBy: { createdAt: "desc" },
  });

  const shaped = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    status: c.status,
    createdAt: c.createdAt,
    totalOrders: c.orders.length,
    totalSpent: c.orders.reduce((s, o) => s + o.totalAmount, 0),
  }));

  return NextResponse.json({ customers: shaped });
}
