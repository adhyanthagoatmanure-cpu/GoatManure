import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

export type OrderWhatsAppRecipient = "customer" | "admin";

export function isOrderReadyForPurchaseNotification(input: {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: string;
}): boolean {
  if (input.orderStatus !== "CONFIRMED") return false;
  return input.paymentMethod === "COD"
    ? input.paymentStatus === "COD_PENDING" || input.paymentStatus === "COD_COLLECTED"
    : input.paymentStatus === "PAID";
}

export function getOrderWhatsAppNotificationClaim(
  recipient: OrderWhatsAppRecipient,
  paymentMethod: PaymentMethod,
  now: Date
): {
  where: Prisma.OrderWhereInput;
  data: Prisma.OrderUpdateManyMutationInput;
} {
  const attemptedAtField = recipient === "customer"
    ? "customerWhatsAppNotificationAttemptedAt"
    : "adminWhatsAppNotificationAttemptedAt";

  return {
    where: {
      orderStatus: "CONFIRMED",
      paymentMethod,
      paymentStatus: paymentMethod === "COD"
        ? { in: ["COD_PENDING", "COD_COLLECTED"] }
        : "PAID",
      [attemptedAtField]: null,
    },
    data: { [attemptedAtField]: now },
  };
}
