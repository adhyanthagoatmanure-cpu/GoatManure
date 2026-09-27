import { prisma } from "@/lib/prisma";

export type AdminNotificationInput = {
  type: "ORDER" | "CONTACT" | "CUSTOMER" | "INVENTORY";
  title: string;
  message: string;
  href?: string;
};

/**
 * Notifications are auxiliary to the customer-facing operation. A database
 * outage must be visible in server logs without turning a successful order
 * or contact submission into a failure.
 */
export async function createAdminNotification(input: AdminNotificationInput) {
  try {
    return await prisma.adminNotification.create({ data: input });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION] Could not create notification", error);
    return null;
  }
}
