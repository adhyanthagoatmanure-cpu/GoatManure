import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/server/payment/razorpay-provider";
import { z } from "zod";

const bodySchema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentMethod !== "ONLINE") {
    return NextResponse.json({ error: "This order is not set up for online payment" }, { status: 400 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order has already been paid for" }, { status: 400 });
  }

  const provider = getPaymentProvider();
  if (!provider.isConfigured) {
    return NextResponse.json(
      { error: "Online payments are not configured yet. Please choose Cash on Delivery, or contact support." },
      { status: 503 }
    );
  }

  let gatewayOrder;
  try {
    gatewayOrder = await provider.createOrder({
      orderId: order.id,
      amountInRupees: order.totalAmount, // server-side amount — the DB's, never the client's
      receipt: order.orderNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Razorpay order";
    const isAuthFailure = /authentication|unauthorized|invalid key|bad request/i.test(message);
    return NextResponse.json(
      { error: isAuthFailure ? "Razorpay authentication failed" : "Unable to create payment order" },
      { status: isAuthFailure ? 401 : 500 }
    );
  }

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      amount: order.totalAmount,
      status: "PENDING",
      gatewayOrderId: gatewayOrder.gatewayOrderId,
    },
    update: { gatewayOrderId: gatewayOrder.gatewayOrderId, status: "PENDING" },
  });
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: gatewayOrder.gatewayOrderId } });

  return NextResponse.json({
    ...gatewayOrder,
    order_id: gatewayOrder.gatewayOrderId,
    amount: gatewayOrder.amountInPaise,
  });
}
