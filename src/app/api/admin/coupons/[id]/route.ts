import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { couponSchema } from "@/lib/validations/admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon" }, { status: 400 });
  }
  const data = parsed.data;

  const conflict = await prisma.coupon.findFirst({ where: { code: data.code, NOT: { id } } });
  if (conflict) return NextResponse.json({ error: "Another coupon already uses this code" }, { status: 409 });

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code: data.code,
      discountType: data.discountType,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    },
  });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const usageCount = await prisma.couponUsage.count({ where: { couponId: id } });
  if (usageCount > 0) {
    // Preserve order/discount history — disable rather than delete a coupon
    // that's already been redeemed.
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, disabled: true });
  }
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Quick enable/disable toggle without a full edit.
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const coupon = await prisma.coupon.update({ where: { id }, data: { isActive: Boolean(body.isActive) } });
  return NextResponse.json({ coupon });
}
