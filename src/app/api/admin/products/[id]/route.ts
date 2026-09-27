import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, benefits: { orderBy: { sortOrder: "asc" } }, category: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
  }
  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);

  const slugOwner = await prisma.product.findUnique({ where: { slug } });
  if (slugOwner && slugOwner.id !== id) {
    return NextResponse.json({ error: "A product with this URL slug already exists" }, { status: 409 });
  }

  const incomingIds = data.variants.filter((v) => v.id).map((v) => v.id!);
  const toDelete = existing.variants.filter((v) => !incomingIds.includes(v.id)).map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      // Variants referenced by past orders are kept for history — only
      // detach ones that were never ordered.
      const referenced = await tx.orderItem.findMany({ where: { variantId: { in: toDelete } }, select: { variantId: true } });
      const referencedIds = new Set(referenced.map((r) => r.variantId));
      const safeToDelete = toDelete.filter((vid) => !referencedIds.has(vid));
      if (safeToDelete.length > 0) await tx.productVariant.deleteMany({ where: { id: { in: safeToDelete } } });
    }

    await tx.productBenefit.deleteMany({ where: { productId: id } });

    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description,
        howToUse: data.howToUse || null,
        shippingInfo: data.shippingInfo || null,
        categoryId: data.categoryId || null,
        images: data.images,
        status: data.status,
        featured: data.featured,
        sku: data.sku || null,
        benefits: { create: data.benefits.map((b, i) => ({ title: b.title, icon: b.icon, sortOrder: i })) },
      },
    });

    for (const [i, v] of data.variants.entries()) {
      const payload = {
        weightLabel: v.weightLabel,
        weightValue: v.weightValue,
        weightUnit: v.weightUnit,
        sku: v.sku || null,
        originalPrice: v.originalPrice,
        offerPrice: v.offerPrice,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
        isDefault: v.isDefault,
        sortOrder: i,
      };
      if (v.id) {
        await tx.productVariant.update({ where: { id: v.id }, data: payload });
      } else {
        await tx.productVariant.create({ data: { ...payload, productId: id } });
      }
    }
  });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, benefits: true },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderCount = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (orderCount > 0) {
    // Preserve order history — disable instead of hard-deleting a product
    // that's been sold before.
    await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
