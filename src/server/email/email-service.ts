import { BrevoClient } from "@getbrevo/brevo";

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

const BREVO_API_KEY = process.env.BREVO_API_KEY ?? "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL ?? "";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME ?? "ADHYANTHA";

/** Logs to the server console instead of sending. Used automatically until
 * BREVO_API_KEY and BREVO_SENDER_EMAIL are set, so auth + order flows are fully
 * testable before real email credentials exist. */
class ConsoleEmailService implements EmailService {
  async send(_input: SendEmailInput): Promise<SendEmailResult> {
    void _input;
    console.log("EMAIL NOT SENT - BREVO NOT CONFIGURED");
    return { sent: false, accepted: [], rejected: [] };
  }
}

class BrevoEmailService implements EmailService {
  private client = new BrevoClient({ apiKey: BREVO_API_KEY });

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const result = await this.client.transactionalEmails.sendTransacEmail({
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME,
      },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    });
    console.log("BREVO EMAIL ACCEPTED", JSON.stringify({ messageId: result.messageId }));
    return {
      sent: true,
      messageId: result.messageId,
      accepted: [input.to],
      rejected: [],
    };
  }
}

let instance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!instance) {
    instance =
      BREVO_API_KEY && BREVO_SENDER_EMAIL
        ? new BrevoEmailService()
        : new ConsoleEmailService();
  }
  return instance;
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
