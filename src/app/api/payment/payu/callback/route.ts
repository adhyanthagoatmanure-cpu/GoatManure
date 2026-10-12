import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPayUCallbackAction,
  getPayUConfig,
  getPayUResponseOutcome,
  verifyPayUResponseHash,
} from "@/server/payment/payu-provider";
import { createOrder } from "@/server/services/order.service";
import { notifyOrder } from "@/server/services/order-notification.service";
import { createAdminNotification } from "@/server/services/admin-notification.service";
import type { AddressInput } from "@/lib/validations/checkout";
import type { RawCartLine } from "@/server/services/pricing.service";

function redirectToCheckout(baseUrl: string, result: "invalid") {
  return NextResponse.redirect(new URL(`/checkout?payment=${result}`, baseUrl), 303);
}

function redirectToPaymentStatus(baseUrl: string, intentId: string) {
  return NextResponse.redirect(new URL(`/payment-status/${encodeURIComponent(intentId)}`, baseUrl), 303);
}

function redirectToOrder(baseUrl: string, orderId: string) {
  return NextResponse.redirect(new URL(`/order-success/${encodeURIComponent(orderId)}?clearCart=1`, baseUrl), 303);
}

export async function GET() {
  const siteUrl = process.env.NEXTAUTH_URL?.trim();
  if (!siteUrl) return new NextResponse("Payment response could not be processed.", { status: 503 });
  try {
    return redirectToCheckout(siteUrl, "invalid");
  } catch {
    return new NextResponse("Payment response could not be processed.", { status: 503 });
  }
}

export async function POST(req: Request) {
  const config = getPayUConfig();
  if (!config) return new NextResponse("PayU callback is not configured.", { status: 503 });
  const baseUrl = config.callbackUrl;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return redirectToCheckout(baseUrl, "invalid");
  }

  const response: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") response[key] = value;
  }

  if (response.key !== config.key || !response.txnid || !verifyPayUResponseHash(config, response)) {
    console.error("[PAYU] Callback signature verification failed");
    return redirectToCheckout(baseUrl, "invalid");
  }

  const intent = await prisma.paymentIntent.findUnique({ where: { gatewayOrderId: response.txnid } });
  if (!intent) {
    console.error("[PAYU] Callback payment intent was not found");
    return redirectToCheckout(baseUrl, "invalid");
  }

  const amount = Number(response.amount);
  if (!Number.isFinite(amount) || amount !== intent.amount) {
    console.error(`[PAYU] Callback amount mismatch for intent=${intent.id}`);
    return redirectToCheckout(baseUrl, "invalid");
  }

  const outcome = getPayUResponseOutcome(response.status);
  const action = getPayUCallbackAction(intent.status, outcome);

  if (action === "paid") {
    return intent.createdOrderId
      ? redirectToOrder(baseUrl, intent.createdOrderId)
      : redirectToPaymentStatus(baseUrl, intent.id);
  }
  if (action === "processing") return redirectToPaymentStatus(baseUrl, intent.id);
  if (action === "fail") {
    await prisma.paymentIntent.updateMany({
      where: { id: intent.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return redirectToPaymentStatus(baseUrl, intent.id);
  }
  if (action === "status") return redirectToPaymentStatus(baseUrl, intent.id);

  if (!response.mihpayid) {
    console.error(`[PAYU] Successful callback missing transaction reference for intent=${intent.id}`);
    return redirectToPaymentStatus(baseUrl, intent.id);
  }

  const claimed = await prisma.paymentIntent.updateMany({
    where: { id: intent.id, status: { in: ["PENDING", "FAILED"] }, gatewayOrderId: response.txnid },
    data: { status: "PROCESSING" },
  });
  if (claimed.count === 0) {
    const latestIntent = await prisma.paymentIntent.findUnique({ where: { id: intent.id } });
    if (latestIntent?.status === "PAID" && latestIntent.createdOrderId) {
      return redirectToOrder(baseUrl, latestIntent.createdOrderId);
    }
    return redirectToPaymentStatus(baseUrl, intent.id);
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
    return redirectToPaymentStatus(baseUrl, intent.id);
  }

  if (!result.ok) {
    console.error(`[PAYU] Payment succeeded but order creation failed for intent=${intent.id}: ${result.reason}`);
    return redirectToPaymentStatus(baseUrl, intent.id);
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

  return redirectToOrder(baseUrl, orderId);
}
