import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      addresses: true,
    },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({ customer });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";

  const customer = await prisma.user.update({ where: { id }, data: { status } });
  return NextResponse.json({ customer });
}
