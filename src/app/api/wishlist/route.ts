import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ productId: z.string().min(1) });

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ items: [] });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          avgRating: true,
          reviewCount: true,
          featured: true,
          category: { select: { name: true, slug: true } },
          variants: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, weightLabel: true, weightValue: true, originalPrice: true, offerPrice: true, stock: true, isDefault: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please log in first" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId: parsed.data.productId } },
    create: { userId: session.user.id, productId: parsed.data.productId },
    update: {},
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please log in first" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.wishlistItem
    .delete({
      where: { userId_productId: { userId: session.user.id, productId: parsed.data.productId } },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
