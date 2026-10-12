import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

export const WHATSAPP_OTP_TTL_MS = 5 * 60 * 1000;
export const WHATSAPP_OTP_RESEND_MS = 60 * 1000;
export const WHATSAPP_OTP_TICKET_TTL_MS = 60 * 1000;
export const WHATSAPP_OTP_MAX_ATTEMPTS = 5;

export type WhatsAppOtpPurpose = "REGISTER" | "LOGIN";

export function generateWhatsAppOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateWhatsAppOtpChallengeId(): string {
  return randomUUID();
}

export function hashWhatsAppOtp(
  secret: string,
  challengeId: string,
  purpose: WhatsAppOtpPurpose,
  phone: string,
  code: string
): string {
  return createHmac("sha256", secret)
    .update(`${challengeId}\n${purpose}\n${phone}\n${code}`, "utf8")
    .digest("hex");
}

export function hashWhatsAppOtpTicket(secret: string, ticket: string): string {
  return createHmac("sha256", secret).update(`login-ticket\n${ticket}`, "utf8").digest("hex");
}

export function isWhatsAppOtpHashMatch(expected: string, actual: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(expected) || !/^[a-f0-9]{64}$/i.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

export function isWhatsAppOtpExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function isWhatsAppOtpAttemptAllowed(attempts: number): boolean {
  return Number.isInteger(attempts) && attempts >= 0 && attempts < WHATSAPP_OTP_MAX_ATTEMPTS;
}

export function getWhatsAppOtpRequestIp(headers: Headers): string {
  const address =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return address && address.length <= 128 ? address : "unknown";
}
