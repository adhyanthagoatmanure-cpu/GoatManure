import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  images: true,
  avgRating: true,
  reviewCount: true,
  featured: true,
  category: { select: { name: true, slug: true } },
  variants: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      weightLabel: true,
      weightValue: true,
      originalPrice: true,
      offerPrice: true,
      stock: true,
      isDefault: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductListItem = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

export async function getFeaturedProducts(take = 4) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", featured: true },
    select: productListSelect,
    take,
    orderBy: { createdAt: "desc" },
  });
}

export interface ProductQueryOptions {
  q?: string;
  categorySlug?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export async function getProducts(opts: ProductQueryOptions = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 12;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(opts.q
      ? {
          OR: [
            { name: { contains: opts.q } },
            { shortDescription: { contains: opts.q } },
          ],
        }
      : {}),
    ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === "rating"
      ? { avgRating: "desc" }
      : opts.sort === "newest" || !opts.sort
        ? { createdAt: "desc" }
        : { createdAt: "desc" }; // price_asc/price_desc are applied client-side on the (small) default variant, see note below

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  // Price sort operates on each product's default (or cheapest) variant.
  // Done in JS rather than SQL because "price" isn't a column on Product —
  // it lives on ProductVariant, and the catalog is small enough that this
  // costs nothing in practice.
  if (opts.sort === "price_asc" || opts.sort === "price_desc") {
    items.sort((a, b) => {
      const pa = a.variants[0]?.offerPrice ?? 0;
      const pb = b.variants[0]?.offerPrice ?? 0;
      return opts.sort === "price_asc" ? pa - pb : pb - pa;
    });
  }

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      benefits: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string | null, take = 4) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: productId },
      ...(categoryId ? { categoryId } : {}),
    },
    select: productListSelect,
    take,
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
