import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [benefits, products] = await Promise.all([
    prisma.productBenefit.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: { product: { select: { id: true, name: true, shortDescription: true, status: true, category: { select: { name: true } } } } },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return NextResponse.json({ benefits, products });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.productId !== "string" || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Product and benefit title are required." }, { status: 400 });
  }
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const benefit = await prisma.productBenefit.create({
    data: { productId: product.id, title: body.title.trim(), icon: typeof body.icon === "string" ? body.icon.trim() || null : null },
  });
  return NextResponse.json({ benefit }, { status: 201 });
}
