import { prisma } from "@/lib/prisma";
import { adminOrderNotificationEmail, getEmailService, orderConfirmationEmail } from "@/server/email/email-service";
import { sendAdminOrderWhatsApp, sendCustomerOrderWhatsApp } from "@/server/whatsapp/whatsapp-service";
import { normalizeWhatsAppPhone } from "@/server/whatsapp/phone";

type NotificationChannel = "customer-email" | "customer-whatsapp" | "admin-email" | "admin-whatsapp";

interface NotificationAttempt {
  channel: NotificationChannel;
  destination: string;
  promise: Promise<{ messageId?: string; sent?: boolean }>;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.startsWith("+91") && phone.length >= 7) {
    return `+91******${phone.slice(-4)}`;
  }
  return `${phone.slice(0, 3)}******${phone.slice(-4)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown notification error";
}

function logSkipped(orderId: string, channel: NotificationChannel, reason: string) {
  console.log(`[ORDER_NOTIFICATION] order=${orderId} channel=${channel} status=skipped reason=${reason}`);
}

export async function notifyOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  const email = order.user?.email ?? order.guestEmail;
  const name = order.user?.name ?? order.guestName;
  const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/track-order/${order.id}`;
  const shippingSnapshot =
    order.shippingSnapshot && typeof order.shippingSnapshot === "object" && !Array.isArray(order.shippingSnapshot)
      ? (order.shippingSnapshot as Record<string, unknown>)
      : {};
  const rawCustomerPhone = order.user?.phone ?? order.guestPhone ?? shippingSnapshot.phone;
  const customerPhone = normalizeWhatsAppPhone(rawCustomerPhone);
  const deliveryAddress = [
    shippingSnapshot.line1,
    shippingSnapshot.line2,
    shippingSnapshot.city,
    shippingSnapshot.state,
    shippingSnapshot.pincode,
    shippingSnapshot.country,
  ]
    .filter(Boolean)
    .map(String)
    .join(", ");

  const notification = {
    orderNumber: order.orderNumber,
    customerName: name ?? order.guestName ?? "Guest",
    customerPhone: customerPhone ?? "",
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment",
    items: order.items,
    deliveryAddress,
    trackUrl,
  };
  const attempts: NotificationAttempt[] = [];

  if (email) {
    const tpl = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: name ?? "there",
      totalAmount: order.totalAmount,
      trackUrl,
    });
    attempts.push({
      channel: "customer-email",
      destination: maskEmail(email),
      promise: getEmailService().send({ to: email, ...tpl }),
    });
  } else {
    logSkipped(orderId, "customer-email", "no-customer-email");
  }

  if (customerPhone) {
    attempts.push({
      channel: "customer-whatsapp",
      destination: maskPhone(customerPhone),
      promise: sendCustomerOrderWhatsApp({
        orderNumber: order.orderNumber,
        customerName: name ?? "there",
        customerPhone,
        totalAmount: order.totalAmount,
        paymentMethod: notification.paymentMethod,
        items: order.items.map((item) => ({
          productName: item.productName,
          weightLabel: item.weightLabel,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        trackUrl,
      }),
    });
  } else {
    logSkipped(orderId, "customer-whatsapp", "invalid-or-missing-phone");
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    const tpl = adminOrderNotificationEmail(notification);
    attempts.push({
      channel: "admin-email",
      destination: maskEmail(adminEmail),
      promise: getEmailService().send({ to: adminEmail, ...tpl }),
    });
  } else {
    logSkipped(orderId, "admin-email", "ADMIN_NOTIFICATION_EMAIL-not-configured");
  }

  const adminPhone = normalizeWhatsAppPhone(process.env.WHATSAPP_ADMIN_PHONE ?? process.env.WHATSAPP_ADMIN_PHONE_NUMBER);
  if (adminPhone) {
    attempts.push({
      channel: "admin-whatsapp",
      destination: maskPhone(adminPhone),
      promise: sendAdminOrderWhatsApp(notification),
    });
  } else {
    logSkipped(orderId, "admin-whatsapp", "invalid-or-missing-admin-phone");
  }

  const results = await Promise.allSettled(attempts.map((attempt) => attempt.promise));
  results.forEach((result, index) => {
    const attempt = attempts[index];
    if (result.status === "fulfilled") {
      const delivery = result.value;
      const details = [
        delivery.sent === false ? "sent=false" : "sent=true",
        delivery.messageId ? `messageId=${delivery.messageId}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      console.log(
        `[ORDER_NOTIFICATION] order=${orderId} channel=${attempt.channel} status=${delivery.sent === false ? "skipped" : "success"} destination=${attempt.destination}${details ? ` ${details}` : ""}`
      );
    } else {
      console.error(
        `[ORDER_NOTIFICATION] order=${orderId} channel=${attempt.channel} status=failure destination=${attempt.destination} error=${errorMessage(result.reason)}`
      );
    }
  });
}
