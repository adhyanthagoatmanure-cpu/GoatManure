import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/checkout";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const review = await prisma.review.create({ data: parsed.data });

  // Keep Product.avgRating/reviewCount denormalized so listing pages don't
  // need to aggregate reviews on every request.
  const agg = await prisma.review.aggregate({
    where: { productId: parsed.data.productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
