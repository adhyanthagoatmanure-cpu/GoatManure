import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/server/payment/razorpay-provider";
import { createOrder } from "@/server/services/order.service";
import { notifyOrder } from "@/server/services/order-notification.service";
import { z } from "zod";
import type { AddressInput } from "@/lib/validations/checkout";
import type { RawCartLine } from "@/server/services/pricing.service";
import { createAdminNotification } from "@/server/services/admin-notification.service";

const bodySchema = z.object({
  paymentIntentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * The browser cannot mark an order paid — it can only report what Razorpay
 * told it, which we re-verify here with the secret key before touching
 * paymentStatus. This is the one and only place PaymentStatus becomes PAID.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });

  const { paymentIntentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
  const session = await auth();

  const paymentIntent = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId } });
  if (!paymentIntent || paymentIntent.gatewayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment intent mismatch" }, { status: 400 });
  }
  if (paymentIntent.userId && paymentIntent.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized payment intent" }, { status: 401 });
  }
  if (paymentIntent.status !== "PENDING" || paymentIntent.expiresAt < new Date()) {
    return NextResponse.json({ error: "This payment session has expired" }, { status: 400 });
  }

  const verified = await getPaymentProvider().verifyPayment({
    gatewayOrderId: razorpay_order_id,
    gatewayPaymentId: razorpay_payment_id,
    gatewaySignature: razorpay_signature,
  });

  if (!verified) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const result = await createOrder({
    userId: paymentIntent.userId,
    guestName: paymentIntent.guestName ?? undefined,
    guestEmail: paymentIntent.guestEmail ?? undefined,
    guestPhone: paymentIntent.guestPhone ?? undefined,
    addressId: paymentIntent.addressId ?? undefined,
    newAddress: (paymentIntent.newAddress ?? undefined) as AddressInput | undefined,
    saveNewAddress: Boolean(paymentIntent.userId && paymentIntent.newAddress),
    items: paymentIntent.items as unknown as RawCartLine[],
    couponCode: paymentIntent.couponCode ?? undefined,
    paymentMethod: "ONLINE",
    customerNote: paymentIntent.customerNote ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "The order could not be created after payment. Please contact support." }, { status: 409 });
  }

  const orderId = result.order.id;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        statusHistory: { create: { status: "CONFIRMED", note: "Payment verified — order confirmed" } },
      },
    }),
    prisma.payment.create({
      data: {
        orderId,
        amount: paymentIntent.amount,
        status: "PAID",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
      },
    }),
    prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: "PAID", createdOrderId: orderId },
    }),
  ]);

  console.log(`[ORDER_NOTIFICATION] Trigger Razorpay order=${orderId}`);
  await notifyOrder(orderId);
  await createAdminNotification({
    type: "ORDER",
    title: "Online payment received",
    message: `${result.order.orderNumber} — ₹${result.order.totalAmount}`,
    href: `/admin/orders/${orderId}`,
  });

  return NextResponse.json({ ok: true, orderId });
}
