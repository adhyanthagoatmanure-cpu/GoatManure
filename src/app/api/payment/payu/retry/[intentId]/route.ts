import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canRetryPayUPayment,
  createPayUCheckoutForIntent,
  getPayUConfig,
} from "@/server/payment/payu-provider";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ intentId: string }> }
) {
  const { intentId } = await params;
  const [session, intent] = await Promise.all([
    auth(),
    prisma.paymentIntent.findUnique({ where: { id: intentId } }),
  ]);

  if (!intent || (intent.userId && intent.userId !== session?.user?.id)) {
    return NextResponse.json({ error: "Payment attempt not found." }, { status: 404 });
  }
  if (!canRetryPayUPayment(intent.status, intent.expiresAt)) {
    return NextResponse.json(
      { error: "This payment cannot be retried. Return to checkout to start a new order." },
      { status: 409 }
    );
  }

  const config = getPayUConfig();
  if (!config) {
    return NextResponse.json({ error: "Online payments are temporarily unavailable." }, { status: 503 });
  }

  const transactionId = randomBytes(12).toString("hex");
  const now = new Date();
  const updated = await prisma.paymentIntent.updateMany({
    where: { id: intent.id, status: "FAILED", expiresAt: { gt: now } },
    data: {
      status: "PENDING",
      gatewayOrderId: transactionId,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    },
  });
  if (updated.count === 0) {
    return NextResponse.json(
      { error: "This payment attempt has already changed. Refresh the page and check its status." },
      { status: 409 }
    );
  }

  try {
    const payuCheckout = createPayUCheckoutForIntent(config, intent, transactionId);
    return NextResponse.json({ payuCheckout });
  } catch (error) {
    await prisma.paymentIntent.updateMany({
      where: { id: intent.id, status: "PENDING", gatewayOrderId: transactionId },
      data: { status: "FAILED" },
    });
    console.error("[PAYU] Could not prepare retry checkout", error);
    return NextResponse.json({ error: "Unable to restart this payment. Please try again." }, { status: 500 });
  }
}
