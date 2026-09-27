import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;

  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
  }
  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A product with this URL slug already exists" }, { status: 409 });

  const product = await prisma.product.create({
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
      variants: {
        create: data.variants.map((v, i) => ({
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
        })),
      },
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
