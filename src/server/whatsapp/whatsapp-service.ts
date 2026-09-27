import { normalizeWhatsAppPhone } from "./phone";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const ADMIN_PHONE = process.env.WHATSAPP_ADMIN_PHONE ?? process.env.WHATSAPP_ADMIN_PHONE_NUMBER ?? "";

export interface CustomerOrderWhatsAppInput {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  items: { productName: string; weightLabel: string; quantity: number; lineTotal: number }[];
  trackUrl?: string;
}

export interface AdminOrderWhatsAppInput {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  items: { productName: string; weightLabel: string; quantity: number; lineTotal: number }[];
  deliveryAddress: string;
  trackUrl?: string;
}

export interface WhatsAppSendResult {
  messageId?: string;
}

function getCustomerOrderMessage(input: CustomerOrderWhatsAppInput) {
  const itemsText = input.items
    .map((item) => `• ${item.productName} (${item.weightLabel}) × ${item.quantity}`)
    .join("\n");

  return [
    "🎉 ORDER CONFIRMED — ADHYANTHA",
    "",
    `Hi ${input.customerName || "there"} 👋`,
    "",
    "Thank you for your order. Your order has been successfully placed.",
    "",
    `🧾 Order ID: ${input.orderNumber}`,
    "",
    "🛍️ Items:",
    itemsText || "• No items listed",
    "",
    `💰 Total: ₹${input.totalAmount}`,
    `💳 Payment: ${input.paymentMethod}`,
    "",
    "📦 Your order is being processed.",
    "",
    "🔗 Track your order:",
    input.trackUrl || "",
    "",
    "Thank you for shopping with ADHYANTHA 🌱",
  ].join("\n");
}

function getAdminOrderMessage(input: AdminOrderWhatsAppInput) {
  return [
    "*NEW ORDER RECEIVED*",
    `Order ID: ${input.orderNumber}`,
    `Customer: ${input.customerName}`,
    `Phone: ${input.customerPhone || "Not provided"}`,
    `Payment: ${input.paymentMethod}`,
    `Total: ₹${input.totalAmount}`,
    "",
    "Ordered products:",
    ...input.items.map((item) => `- ${item.productName} (${item.weightLabel}) x${item.quantity} = ₹${item.lineTotal}`),
    "",
    `Delivery Address: ${input.deliveryAddress || "Not provided"}`,
  ].join("\n");
}

async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppSendResult> {
  const recipient = normalizeWhatsAppPhone(to);
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("WhatsApp Cloud API is not configured");
  }
  if (!recipient) {
    throw new Error("WhatsApp recipient phone number is invalid");
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: { preview_url: true, body },
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    messages?: { id?: string }[];
    error?: { message?: string; code?: number | string };
  } | null;

  if (!response.ok) {
    const message = payload?.error?.message ?? "Unknown Meta API error";
    const code = payload?.error?.code ? ` (code ${payload.error.code})` : "";
    throw new Error(`WhatsApp API returned ${response.status}: ${message}${code}`);
  }

  return { messageId: payload?.messages?.[0]?.id };
}

export async function sendCustomerOrderWhatsApp(input: CustomerOrderWhatsAppInput): Promise<WhatsAppSendResult> {
  return sendWhatsAppText(input.customerPhone, getCustomerOrderMessage(input));
}

export async function sendAdminOrderWhatsApp(input: AdminOrderWhatsAppInput): Promise<WhatsAppSendResult> {
  return sendWhatsAppText(ADMIN_PHONE, getAdminOrderMessage(input));
}
