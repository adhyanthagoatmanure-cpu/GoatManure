import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/server/services/order.service";
import { priceCart } from "@/server/services/pricing.service";
import { notifyOrder } from "@/server/services/order-notification.service";
import { checkoutSchema } from "@/lib/validations/checkout";
import { prisma } from "@/lib/prisma";
import { createPayUCheckout, getPayUConfig } from "@/server/payment/payu-provider";
import { generateOrderNumber } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { createAdminNotification } from "@/server/services/admin-notification.service";

export async function POST(req: Request) {
  const session = await auth();
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout data" }, { status: 400 });
  }
  const input = parsed.data;

  // Guests must supply contact details; logged-in users must supply either
  // a saved address or a new one. Both cases are enforced here, not just in
  // the UI, since this endpoint can be called directly.
  if (!session?.user && (!input.guestName || !input.guestEmail || !input.guestPhone)) {
    return NextResponse.json({ error: "Please provide your name, email, and phone number" }, { status: 400 });
  }
  if (!input.addressId && !input.newAddress) {
    return NextResponse.json({ error: "Please provide a shipping address" }, { status: 400 });
  }

  if (input.paymentMethod === "ONLINE") {
    const payuConfig = getPayUConfig();
    if (!payuConfig) {
      return NextResponse.json(
        { error: "PayU payments are not configured yet. Please choose Cash on Delivery, or contact support." },
        { status: 503 }
      );
    }

    const [user, savedAddress] = await Promise.all([
      session?.user?.id
        ? prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, phone: true },
          })
        : null,
      input.addressId && session?.user?.id
        ? prisma.address.findFirst({
            where: { id: input.addressId, userId: session.user.id },
          })
        : null,
    ]);
    if (input.addressId && !savedAddress) {
      return NextResponse.json({ error: "Please provide a valid shipping address." }, { status: 409 });
    }

    const firstName = input.guestName ?? savedAddress?.fullName ?? input.newAddress?.fullName ?? user?.name;
    const email = input.guestEmail ?? user?.email;
    const phone = input.guestPhone ?? savedAddress?.phone ?? input.newAddress?.phone ?? user?.phone;
    if (!firstName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Please provide a name, email, and phone number to continue with PayU." },
        { status: 400 }
      );
    }

    const priced = await priceCart(input.items, {
      couponCode: input.couponCode || undefined,
      userId: session?.user?.id ?? null,
    });
    if (priced.unavailableVariantIds.length > 0 || priced.lines.length === 0) {
      return NextResponse.json({ error: "Some items in your cart are no longer available." }, { status: 409 });
    }
    if (priced.stockIssues.length > 0) {
      return NextResponse.json({ error: "Some items in your cart are out of stock.", stockIssues: priced.stockIssues }, { status: 409 });
    }
    if (priced.couponError) {
      return NextResponse.json({ error: priced.couponError }, { status: 409 });
    }

    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId: session?.user?.id ?? null,
        guestName: firstName.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        addressId: input.addressId,
        newAddress: input.newAddress as Prisma.InputJsonValue | undefined,
        items: input.items as Prisma.InputJsonValue,
        couponCode: input.couponCode || null,
        customerNote: input.customerNote,
        amount: priced.totalAmount,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    const receipt = generateOrderNumber();
    const payuCheckout = createPayUCheckout(payuConfig, {
      transactionId: paymentIntent.id,
      amountInRupees: priced.totalAmount,
      productInfo: `ADHYANTHA order ${receipt}`,
      firstName: firstName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { gatewayOrderId: paymentIntent.id },
    });

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      orderNumber: receipt,
      paymentMethod: input.paymentMethod,
      totalAmount: priced.totalAmount,
      payuCheckout,
    });
  }

  let result: Awaited<ReturnType<typeof createOrder>>;
  try {
    result = await createOrder({
      userId: session?.user?.id ?? null,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      addressId: input.addressId,
      newAddress: input.newAddress,
      saveNewAddress: Boolean(session?.user && input.newAddress),
      items: input.items,
      couponCode: input.couponCode || undefined,
      paymentMethod: input.paymentMethod,
      customerNote: input.customerNote,
    });
  } catch (error) {
    console.error("[CHECKOUT] Could not create order", error);
    return NextResponse.json({ error: "We could not place your order. Please try again." }, { status: 500 });
  }

  if (!result.ok) {
    const messages: Record<string, string> = {
      EMPTY_CART: "Your cart is empty.",
      NO_ADDRESS: "Please provide a valid shipping address.",
      OUT_OF_STOCK: "Some items in your cart are out of stock.",
      UNAVAILABLE_ITEMS: "Some items in your cart are no longer available.",
    };
    return NextResponse.json(
      { error: messages[result.reason], stockIssues: "stockIssues" in result ? result.stockIssues : undefined },
      { status: 409 }
    );
  }

  console.log(`[ORDER_NOTIFICATION] Trigger COD order=${result.order.id}`);
  const notificationResults = await Promise.allSettled([
    notifyOrder(result.order.id),
    createAdminNotification({
      type: "ORDER",
      title: "New order received",
      message: `${result.order.orderNumber} — ₹${result.order.totalAmount}`,
      href: `/admin/orders/${result.order.id}`,
    }),
  ]);
  for (const notificationResult of notificationResults) {
    if (notificationResult.status === "rejected") {
      console.error("[CHECKOUT] COD order notification failed", notificationResult.reason);
    }
  }

  return NextResponse.json({
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    paymentMethod: result.order.paymentMethod,
    totalAmount: result.order.totalAmount,
  });
}
