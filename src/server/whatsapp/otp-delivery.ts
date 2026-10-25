import { normalizeWhatsAppPhone } from "./phone";

export class WhatsAppOtpDeliveryError extends Error {
  constructor(
    readonly category: "not-configured" | "invalid-configuration" | "provider-failure",
    readonly httpStatus?: number,
    readonly providerCode?: number
  ) {
    super("WhatsApp OTP delivery is unavailable");
    this.name = "WhatsAppOtpDeliveryError";
  }
}

export function isWhatsAppOtpRealDeliveryEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.WHATSAPP_OTP_REAL_DELIVERY?.trim() === "true"
  );
}

export function isWhatsAppOtpConfigured(): boolean {
  if (!isWhatsAppOtpRealDeliveryEnabled()) return true;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v22.0";

  return Boolean(
    accessToken &&
      phoneNumberId &&
      /^\d+$/.test(phoneNumberId) &&
      templateName &&
      /^[a-z0-9_]{1,512}$/.test(templateName) &&
      templateLanguage &&
      /^[a-z]{2,3}(?:_[A-Za-z0-9]{2,8})?$/.test(templateLanguage) &&
      /^v\d+\.\d+$/.test(apiVersion)
  );
}

export async function sendWhatsAppOtp(
  recipient: string,
  code: string,
  options: { fetcher?: typeof fetch; production?: boolean } = {}
): Promise<"mocked" | "sent"> {
  const realDelivery = options.production ?? isWhatsAppOtpRealDeliveryEnabled();
  if (!realDelivery) return "mocked";

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v22.0";
  const normalizedRecipient = normalizeWhatsAppPhone(recipient);

  if (!accessToken || !phoneNumberId || !templateName || !templateLanguage) {
    throw new WhatsAppOtpDeliveryError("not-configured");
  }
  if (
    !/^\d+$/.test(phoneNumberId) ||
    !/^[a-z0-9_]{1,512}$/.test(templateName) ||
    !/^[a-z]{2,3}(?:_[A-Za-z0-9]{2,8})?$/.test(templateLanguage) ||
    !/^v\d+\.\d+$/.test(apiVersion) ||
    !normalizedRecipient ||
    !/^\d{6}$/.test(code)
  ) {
    throw new WhatsAppOtpDeliveryError("invalid-configuration");
  }

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedRecipient.slice(1),
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: code }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );
  } catch {
    throw new WhatsAppOtpDeliveryError("provider-failure");
  }

  if (!response.ok) {
    let providerCode: number | undefined;
    try {
      const payload = await response.clone().json() as {
        error?: { code?: unknown };
      };
      if (typeof payload.error?.code === "number") providerCode = payload.error.code;
    } catch {
      // A non-JSON provider response still has a useful HTTP status.
    }
    throw new WhatsAppOtpDeliveryError("provider-failure", response.status, providerCode);
  }

  return "sent";
}
