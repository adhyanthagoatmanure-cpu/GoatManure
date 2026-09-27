import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { couponSchema } from "@/lib/validations/admin";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      perUserLimit: data.perUserLimit,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
