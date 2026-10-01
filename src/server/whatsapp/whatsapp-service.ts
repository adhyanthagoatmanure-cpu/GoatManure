import { normalizeWhatsAppPhone } from "./phone";

const TEMPLATE_LANGUAGE = "en";
const MAX_TEMPLATE_PARAMETER_LENGTH = 1024;

interface OrderWhatsAppTemplateInput {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  items: { productName: string; weightLabel: string; quantity: number }[];
}

interface CustomerOrderWhatsAppInput extends OrderWhatsAppTemplateInput {
  customerPhone: string;
}

export interface WhatsAppSendResult {
  messageId?: string;
}

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly errorCode?: string | number
  ) {
    super(message);
    this.name = "WhatsAppApiError";
  }
}

function cleanTemplateText(value: string, maxLength: number): string {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
}

function summarizeOrderItems(items: OrderWhatsAppTemplateInput["items"]): string {
  if (items.length === 0) return "Order items unavailable";

  const summaries = items.map((item) => {
    const name = cleanTemplateText(item.productName, 200) || "Product";
    const weight = cleanTemplateText(item.weightLabel, 64);
    const description = weight ? `${name} (${weight})` : name;
    return `${description} x${item.quantity}`;
  });
  const included: string[] = [];

  for (const [index, summary] of summaries.entries()) {
    const candidate = [...included, summary].join("; ");
    const remainingCount = summaries.length - index - 1;
    const suffix = remainingCount > 0 ? `; +${remainingCount} more item${remainingCount === 1 ? "" : "s"}` : "";
    if (candidate.length + suffix.length <= MAX_TEMPLATE_PARAMETER_LENGTH) {
      included.push(summary);
      continue;
    }

    const omittedCount = summaries.length - included.length;
    const remainder = `; +${omittedCount} more item${omittedCount === 1 ? "" : "s"}`;
    return `${included.join("; ")}${remainder}`;
  }

  return included.join("; ");
}

function orderTemplateParameters(
  input: OrderWhatsAppTemplateInput,
  templateName: "order_confirmation" | "new_order_admin"
): string[] {
  const totalQuantity = input.items.reduce((total, item) => total + item.quantity, 0);
  const customerName = cleanTemplateText(input.customerName, MAX_TEMPLATE_PARAMETER_LENGTH) || "Customer";
  const orderNumber = cleanTemplateText(input.orderNumber, MAX_TEMPLATE_PARAMETER_LENGTH);
  const productSummary = summarizeOrderItems(input.items);
  const quantity = `${totalQuantity} total unit${totalQuantity === 1 ? "" : "s"}`;
  const totalAmount = input.totalAmount.toLocaleString("en-IN");

  return templateName === "order_confirmation"
    ? [customerName, orderNumber, productSummary, quantity, totalAmount]
    : [orderNumber, customerName, productSummary, quantity, totalAmount];
}

async function sendOrderTemplate(
  to: string,
  templateName: "order_confirmation" | "new_order_admin",
  parameters: string[]
): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v22.0";
  const recipient = normalizeWhatsAppPhone(to);

  if (!accessToken) throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
  if (!phoneNumberId || !/^\d+$/.test(phoneNumberId)) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured correctly");
  }
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw new Error("WHATSAPP_API_VERSION must use the format vNN.N");
  }
  if (!recipient) throw new Error("WhatsApp recipient phone number is invalid");

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient.slice(1),
      type: "template",
      template: {
        name: templateName,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: parameters.map((text) => ({
              type: "text",
              text: cleanTemplateText(text, MAX_TEMPLATE_PARAMETER_LENGTH),
            })),
          },
        ],
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    messages?: { id?: string }[];
    error?: { message?: string; code?: string | number };
  } | null;

  if (!response.ok) {
    const message = cleanTemplateText(payload?.error?.message ?? "Meta returned an unspecified error", 240);
    throw new WhatsAppApiError(message, response.status, payload?.error?.code);
  }

  return { messageId: payload?.messages?.[0]?.id };
}

export async function sendCustomerOrderWhatsApp(
  input: CustomerOrderWhatsAppInput
): Promise<WhatsAppSendResult> {
  return sendOrderTemplate(input.customerPhone, "order_confirmation", orderTemplateParameters(input, "order_confirmation"));
}

export async function sendAdminOrderWhatsApp(
  input: OrderWhatsAppTemplateInput
): Promise<WhatsAppSendResult> {
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE?.trim() || process.env.WHATSAPP_ADMIN_PHONE_NUMBER?.trim() || "";
  return sendOrderTemplate(adminPhone, "new_order_admin", orderTemplateParameters(input, "new_order_admin"));
}
