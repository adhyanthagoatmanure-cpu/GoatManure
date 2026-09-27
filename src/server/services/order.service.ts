import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { priceCart, type RawCartLine, type StockIssue } from "./pricing.service";
import type { AddressInput } from "@/lib/validations/checkout";
import { Prisma, type Order, type PaymentMethod } from "@prisma/client";

export interface CreateOrderInput {
  userId: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  addressId?: string; // an existing, owned Address
  newAddress?: AddressInput; // used for guests, or "ship to a new address"
  saveNewAddress?: boolean; // logged-in users only
  items: RawCartLine[];
  couponCode?: string;
  paymentMethod: PaymentMethod;
  customerNote?: string;
}

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "EMPTY_CART" | "NO_ADDRESS" | "OUT_OF_STOCK" | "UNAVAILABLE_ITEMS"; stockIssues?: StockIssue[] };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!input.items.length) return { ok: false, reason: "EMPTY_CART" };

  // Resolve the shipping address snapshot up front — a JSON copy is always
  // stored on the order so later edits to a saved Address never rewrite history.
  let shippingSnapshot: Prisma.InputJsonValue | null = null;
  let addressId: string | null = null;

  if (input.addressId) {
    const addr = input.userId
      ? await prisma.address.findFirst({ where: { id: input.addressId, userId: input.userId } })
      : null;
    if (!addr) return { ok: false, reason: "NO_ADDRESS" };
    addressId = addr.id;
    shippingSnapshot = {
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    };
  } else if (input.newAddress) {
    shippingSnapshot = { ...input.newAddress };
    if (input.userId && input.saveNewAddress) {
      const created = await prisma.address.create({
        data: { ...input.newAddress, userId: input.userId },
      });
      addressId = created.id;
    }
  }

  if (!shippingSnapshot) return { ok: false, reason: "NO_ADDRESS" };

  try {
    const order = await prisma.$transaction(async (tx) => {
      const priced = await priceCart(input.items, {
        couponCode: input.couponCode,
        userId: input.userId,
        db: tx,
      });

      if (priced.unavailableVariantIds.length > 0) {
        throw new OrderCreationError("UNAVAILABLE_ITEMS");
      }
      if (priced.lines.length === 0) {
        throw new OrderCreationError("EMPTY_CART");
      }

      // Conditional decrement: only succeeds if enough stock still exists at
      // the moment of commit. This is what actually prevents overselling
      // under concurrent checkouts — a plain read-then-write would not.
      for (const line of priced.lines) {
        const result = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (result.count === 0) {
          throw new OrderCreationError("OUT_OF_STOCK", [
            {
              variantId: line.variantId,
              productName: line.productName,
              weightLabel: line.weightLabel,
              requested: line.quantity,
              available: line.availableStock,
            },
          ]);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: input.userId,
          guestName: input.userId ? null : input.guestName,
          guestEmail: input.userId ? null : input.guestEmail,
          guestPhone: input.userId ? null : input.guestPhone,
          addressId,
          shippingSnapshot: shippingSnapshot!,
          subtotal: priced.subtotal,
          discountAmount: priced.discountAmount,
          couponId: priced.coupon?.id,
          shippingFee: priced.shippingFee,
          totalAmount: priced.totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "COD" ? "COD_PENDING" : "PENDING",
          orderStatus: input.paymentMethod === "COD" ? "CONFIRMED" : "NEW",
          customerNote: input.customerNote,
          items: {
            create: priced.lines.map((l) => ({
              variantId: l.variantId,
              productName: l.productName,
              weightLabel: l.weightLabel,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          statusHistory: {
            create: {
              status: input.paymentMethod === "COD" ? "CONFIRMED" : "NEW",
              note: input.paymentMethod === "COD" ? "Order confirmed — Cash on Delivery" : "Order placed, awaiting payment",
            },
          },
        },
      });

      if (priced.coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: priced.coupon.id,
            userId: input.userId,
            orderId: created.id,
            discountAmount: priced.discountAmount,
          },
        });
        await tx.coupon.update({
          where: { id: priced.coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }

      return created;
    });

    return { ok: true, order };
  } catch (err) {
    if (err instanceof OrderCreationError) {
      if (err.reason === "OUT_OF_STOCK") {
        return { ok: false, reason: "OUT_OF_STOCK", stockIssues: err.stockIssues };
      }
      return { ok: false, reason: err.reason };
    }
    throw err;
  }
}

class OrderCreationError extends Error {
  constructor(
    public reason: "OUT_OF_STOCK" | "UNAVAILABLE_ITEMS" | "EMPTY_CART",
    public stockIssues?: StockIssue[]
  ) {
    super(reason);
  }
}

/** Restores stock for an order's items — used when an admin cancels an order. */
export async function restockOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  await prisma.$transaction(
    items.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
}
