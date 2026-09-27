import { prisma } from "@/lib/prisma";
import { calculateShippingFee } from "@/lib/config";
import { normalizeProductImages } from "@/lib/utils";
import type { Coupon, Prisma } from "@prisma/client";

/** Either the global client or a transaction handle — lets order creation
 * reuse this exact pricing logic atomically inside `prisma.$transaction`. */
type Db = typeof prisma | Prisma.TransactionClient;

export interface RawCartLine {
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  weightLabel: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
}

export interface StockIssue {
  variantId: string;
  productName: string;
  weightLabel: string;
  requested: number;
  available: number;
}

export interface PriceCartResult {
  lines: PricedLine[];
  unavailableVariantIds: string[];
  stockIssues: StockIssue[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  coupon: { id: string; code: string } | null;
  couponError: string | null;
}

/**
 * The single source of truth for what a cart costs. Every price, every
 * discount, and every stock check is re-derived here from the database on
 * every call — nothing about money is ever accepted from the client.
 */
export async function priceCart(
  rawItems: RawCartLine[],
  opts: { couponCode?: string | null; userId?: string | null; db?: Db } = {}
): Promise<PriceCartResult> {
  const db = opts.db ?? prisma;
  const merged = new Map<string, number>();
  for (const item of rawItems) {
    if (item.quantity < 1) continue;
    merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  }
  const variantIds = [...merged.keys()];

  const variants = variantIds.length
    ? await db.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      })
    : [];

  const lines: PricedLine[] = [];
  const unavailableVariantIds: string[] = [];
  const stockIssues: StockIssue[] = [];

  for (const [variantId, quantity] of merged) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant || variant.product.status !== "ACTIVE") {
      unavailableVariantIds.push(variantId);
      continue;
    }
    if (variant.stock < quantity) {
      stockIssues.push({
        variantId,
        productName: variant.product.name,
        weightLabel: variant.weightLabel,
        requested: quantity,
        available: variant.stock,
      });
    }
    const firstImage = normalizeProductImages(variant.product.images)[0] ?? null;

    lines.push({
      variantId,
      productId: variant.productId,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      image: firstImage,
      weightLabel: variant.weightLabel,
      unitPrice: variant.offerPrice,
      originalPrice: variant.originalPrice,
      quantity,
      lineTotal: variant.offerPrice * quantity,
      availableStock: variant.stock,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let discountAmount = 0;
  let couponError: string | null = null;
  let appliedCoupon: { id: string; code: string } | null = null;

  if (opts.couponCode && opts.couponCode.trim()) {
    const result = await validateCoupon(opts.couponCode, subtotal, opts.userId ?? null, db);
    if (result.ok) {
      discountAmount = result.discountAmount;
      appliedCoupon = { id: result.coupon.id, code: result.coupon.code };
    } else {
      couponError = result.message;
    }
  }

  const shippingFee = calculateShippingFee(subtotal);
  const totalAmount = Math.max(subtotal - discountAmount + shippingFee, 0);

  return {
    lines,
    unavailableVariantIds,
    stockIssues,
    subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    coupon: appliedCoupon,
    couponError,
  };
}

type CouponValidationResult =
  | { ok: true; coupon: Coupon; discountAmount: number }
  | { ok: false; message: string };

export async function validateCoupon(
  rawCode: string,
  subtotal: number,
  userId: string | null,
  db: Db = prisma
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    return { ok: false, message: "This coupon code is not valid." };
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: "This coupon is not active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, message: "This coupon has expired." };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      ok: false,
      message: `Add ₹${coupon.minOrderAmount - subtotal} more to use this coupon (minimum order ₹${coupon.minOrderAmount}).`,
    };
  }
  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.perUserLimit && userId) {
    const usedByUser = await db.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (usedByUser >= coupon.perUserLimit) {
      return { ok: false, message: "You've already used this coupon the maximum number of times." };
    }
  }

  const rawDiscount =
    coupon.discountType === "FIXED"
      ? coupon.value
      : Math.round((subtotal * coupon.value) / 100);
  const capped =
    coupon.discountType === "PERCENTAGE" && coupon.maxDiscount
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;
  const discountAmount = Math.min(capped, subtotal);

  return { ok: true, coupon, discountAmount };
}
