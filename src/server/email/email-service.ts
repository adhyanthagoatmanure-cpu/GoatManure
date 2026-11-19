export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailService {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

function getBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY?.trim() ?? "";
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() ?? "";
  if (!apiKey && !senderEmail) return null;
  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL are required for email delivery");
  }
  return {
    apiKey,
    senderEmail,
    senderName: process.env.BREVO_SENDER_NAME?.trim() || "ADHYANTHA",
  };
}

function maskEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  return atIndex > 0 ? `${email[0]}***${email.slice(atIndex)}` : "[redacted]";
}

function safeProviderResponse(response: string): string {
  return response
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}

async function getProviderError(response: Response): Promise<string> {
  const body = await response.text();
  return safeProviderResponse(body) || `Brevo API request failed with status ${response.status}`;
}

class ConsoleEmailService implements EmailService {
  async send(_input: SendEmailInput): Promise<SendEmailResult> {
    void _input;
    console.log("EMAIL NOT SENT - BREVO API NOT CONFIGURED");
    return { sent: false, accepted: [], rejected: [] };
  }
}

class BrevoEmailService implements EmailService {
  constructor(private readonly config: BrevoConfig) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    let response: Response;
    try {
      response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": this.config.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: this.config.senderEmail, name: this.config.senderName },
          to: [{ email: input.to }],
          subject: input.subject,
          htmlContent: input.html,
          ...(input.text ? { textContent: input.text } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error("BREVO EMAIL REQUEST FAILED", JSON.stringify({
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
      throw error;
    }

    if (!response.ok) {
      const error = await getProviderError(response);
      console.error("BREVO EMAIL REJECTED", JSON.stringify({
        status: response.status,
        response: error,
      }));
      throw new Error(`Brevo rejected the email request (HTTP ${response.status})`);
    }

    const body = await response.json() as { messageId?: unknown };
    const messageId = typeof body.messageId === "string" ? body.messageId : undefined;
    console.info("BREVO EMAIL ACCEPTED", JSON.stringify({
      messageId,
      acceptedRecipients: [maskEmail(input.to)],
      rejectedRecipients: [],
    }));
    return {
      sent: true,
      messageId,
      accepted: [input.to],
      rejected: [],
    };
  }

  async verify(): Promise<void> {
    let response: Response;
    try {
      response = await fetch("https://api.brevo.com/v3/account", {
        headers: { accept: "application/json", "api-key": this.config.apiKey },
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error("BREVO API VERIFICATION FAILED", JSON.stringify({
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
      throw error;
    }

    if (!response.ok) {
      const error = await getProviderError(response);
      console.error("BREVO API VERIFICATION FAILED", JSON.stringify({
        status: response.status,
        response: error,
      }));
      throw new Error(`Brevo API verification failed (HTTP ${response.status})`);
    }
    console.info("BREVO API KEY VERIFIED");
  }
}

let instance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!instance) {
    try {
      const config = getBrevoConfig();
      instance = config ? new BrevoEmailService(config) : new ConsoleEmailService();
    } catch (error) {
      console.error(
        "BREVO CONFIGURATION INVALID",
        error instanceof Error ? error.message : "Invalid configuration"
      );
      throw error;
    }
  }
  return instance;
}

export async function verifyEmailConnection(): Promise<void> {
  const emailService = getEmailService();
  if (!(emailService instanceof BrevoEmailService)) {
    throw new Error("Brevo API is not configured");
  }
  await emailService.verify();
}

// ── Templates ────────────────────────────────────────────────────────────

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Reset your ADHYANTHA password",
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#2B4C1F">Reset your password</h2>
      <p>We received a request to reset your ADHYANTHA account password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="background:#2B4C1F;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a></p>
      <p style="color:#6b6b5e;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  };
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  trackUrl: string;
}) {
  return {
    subject: `Order Confirmed — ${params.orderNumber}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#2B4C1F">Thank you, ${params.customerName}!</h2>
      <p>Your order <strong>${params.orderNumber}</strong> has been placed successfully. Total: ₹${params.totalAmount}.</p>
      <p><a href="${params.trackUrl}" style="background:#2B4C1F;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Track Your Order</a></p>
    </div>`,
  };
}

export function adminOrderNotificationEmail(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  items: { productName: string; weightLabel: string; quantity: number; lineTotal: number }[];
  trackUrl: string;
}) {
  const itemRows = params.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${item.productName} (${item.weightLabel}) x${item.quantity}</td><td style="padding:6px 0;text-align:right">₹${item.lineTotal}</td></tr>`
    )
    .join("");

  return {
    subject: `New order received — ${params.orderNumber}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#2B4C1F">New order received</h2>
      <p><strong>${params.orderNumber}</strong> from ${params.customerName} (${params.customerPhone || "No phone provided"})</p>
      <table style="width:100%;border-collapse:collapse">${itemRows}</table>
      <p><strong>Total:</strong> ₹${params.totalAmount} &nbsp; <strong>Payment:</strong> ${params.paymentMethod}</p>
      <p><a href="${params.trackUrl}" style="background:#2B4C1F;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">View Order</a></p>
    </div>`,
    text: [
      `New order received: ${params.orderNumber}`,
      `Customer: ${params.customerName}`,
      `Phone: ${params.customerPhone || "No phone provided"}`,
      ...params.items.map((item) => `${item.productName} (${item.weightLabel}) x${item.quantity} — ₹${item.lineTotal}`),
      `Total: ₹${params.totalAmount}`,
      `Payment: ${params.paymentMethod}`,
      `View order: ${params.trackUrl}`,
    ].join("\n"),
  };
}
