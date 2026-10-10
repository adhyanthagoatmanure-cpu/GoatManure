import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayUConfig, verifyPayUResponseHash } from "@/server/payment/payu-provider";
import { createOrder } from "@/server/services/order.service";
import { notifyOrder } from "@/server/services/order-notification.service";
import { createAdminNotification } from "@/server/services/admin-notification.service";
import type { AddressInput } from "@/lib/validations/checkout";
import type { RawCartLine } from "@/server/services/pricing.service";

export async function POST(req: Request) {
  const config = getPayUConfig();
  if (!config) return new NextResponse("PayU callback is not configured.", { status: 503 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new NextResponse("Invalid PayU response.", { status: 400 });
  }

  const response: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") response[key] = value;
  }

  if (response.key !== config.key || !response.txnid || !verifyPayUResponseHash(config, response)) {
    console.error("[PAYU] Callback signature verification failed");
    return new NextResponse("PayU response verification failed.", { status: 400 });
  }

  const intent = await prisma.paymentIntent.findUnique({ where: { id: response.txnid } });
  if (!intent || intent.gatewayOrderId !== response.txnid) {
    return new NextResponse("Payment intent not found.", { status: 404 });
  }

  const amount = Number(response.amount);
  if (!Number.isFinite(amount) || amount !== intent.amount) {
    console.error(`[PAYU] Callback amount mismatch for intent=${intent.id}`);
    return new NextResponse("PayU payment amount did not match the order.", { status: 400 });
  }

  const returnToCheckout = (result: string) =>
    NextResponse.redirect(new URL(`/checkout?payment=${result}`, new URL(config.callbackUrl).origin), 303);

  if (response.status?.toLowerCase() !== "success") {
    if (response.status?.toLowerCase() === "failure" && intent.status === "PENDING") {
      await prisma.paymentIntent.updateMany({
        where: { id: intent.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
    return returnToCheckout(response.status?.toLowerCase() === "pending" ? "pending" : "failed");
  }

  if (intent.status === "PAID" && intent.createdOrderId) {
    return NextResponse.redirect(
      new URL(`/order-success/${intent.createdOrderId}?clearCart=1`, new URL(config.callbackUrl).origin),
      303
    );
  }

  if (intent.status === "PROCESSING") {
    return returnToCheckout("pending");
  }
  if (intent.status !== "PENDING" && intent.status !== "FAILED") {
    return returnToCheckout("failed");
  }

  if (!response.mihpayid) {
    return new NextResponse("PayU transaction reference is missing.", { status: 400 });
  }

  const claimed = await prisma.paymentIntent.updateMany({
    where: { id: intent.id, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PROCESSING" },
  });
  if (claimed.count === 0) {
    const latestIntent = await prisma.paymentIntent.findUnique({ where: { id: intent.id } });
    if (latestIntent?.status === "PAID" && latestIntent.createdOrderId) {
      return NextResponse.redirect(
        new URL(`/order-success/${latestIntent.createdOrderId}?clearCart=1`, new URL(config.callbackUrl).origin),
        303
      );
    }
    return returnToCheckout("pending");
  }

  let result: Awaited<ReturnType<typeof createOrder>>;
  try {
    result = await createOrder({
      userId: intent.userId,
      guestName: intent.guestName ?? undefined,
      guestEmail: intent.guestEmail ?? undefined,
      guestPhone: intent.guestPhone ?? undefined,
      addressId: intent.addressId ?? undefined,
      newAddress: (intent.newAddress ?? undefined) as AddressInput | undefined,
      saveNewAddress: Boolean(intent.userId && intent.newAddress),
      items: intent.items as unknown as RawCartLine[],
      couponCode: intent.couponCode ?? undefined,
      paymentMethod: "ONLINE",
      customerNote: intent.customerNote ?? undefined,
    });
  } catch (error) {
    await prisma.paymentIntent.updateMany({
      where: { id: intent.id, status: "PROCESSING" },
      data: { status: "PENDING" },
    });
    console.error(`[PAYU] Order creation failed for intent=${intent.id}`, error);
    return new NextResponse("The order could not be created. Please try the payment again.", { status: 500 });
  }

  if (!result.ok) {
    console.error(`[PAYU] Payment succeeded but order creation failed for intent=${intent.id}: ${result.reason}`);
    return new NextResponse("Payment was received, but the order needs support review.", { status: 409 });
  }

  const orderId = result.order.id;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        statusHistory: { create: { status: "CONFIRMED", note: "Payment verified — order confirmed" } },
      },
    }),
    prisma.payment.create({
      data: {
        orderId,
        provider: "payu",
        amount: intent.amount,
        status: "PAID",
        gatewayOrderId: response.txnid,
        gatewayPaymentId: response.mihpayid,
        gatewaySignature: response.hash,
        rawResponse: {
          status: response.status,
          amount: response.amount,
          mihpayid: response.mihpayid,
          bank_ref_num: response.bank_ref_num ?? null,
        },
      },
    }),
    prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "PAID", createdOrderId: orderId },
    }),
  ]);

  console.log(`[ORDER_NOTIFICATION] Trigger PayU order=${orderId}`);
  const notificationResults = await Promise.allSettled([
    notifyOrder(orderId),
    createAdminNotification({
      type: "ORDER",
      title: "Online payment received",
      message: `${result.order.orderNumber} — ₹${result.order.totalAmount}`,
      href: `/admin/orders/${orderId}`,
    }),
  ]);
  for (const notificationResult of notificationResults) {
    if (notificationResult.status === "rejected") {
      console.error("[PAYU] Paid order notification failed", notificationResult.reason);
    }
  }

  return NextResponse.redirect(
    new URL(`/order-success/${orderId}?clearCart=1`, new URL(config.callbackUrl).origin),
    303
  );
}
