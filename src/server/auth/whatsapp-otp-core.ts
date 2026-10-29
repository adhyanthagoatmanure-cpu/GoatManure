import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { normalizeIndianMobileNumber } from "@/lib/validations/phone";

export const WHATSAPP_OTP_TTL_MS = 5 * 60 * 1000;
export const WHATSAPP_OTP_RESEND_MS = 60 * 1000;
export const WHATSAPP_OTP_TICKET_TTL_MS = 60 * 1000;
export const WHATSAPP_OTP_MAX_ATTEMPTS = 5;

export type WhatsAppOtpPurpose = "REGISTER" | "LOGIN" | "PROFILE";

export interface WhatsAppOtpLoginUser {
  id: string;
  status: string;
  role: string;
}

export interface WhatsAppOtpLoginUserLookup<T extends WhatsAppOtpLoginUser> {
  findVerifiedPhone(phone: string): Promise<T | null>;
  findLegacyUsers(phoneCandidates: string[]): Promise<T[]>;
}

export async function findEligibleWhatsAppOtpLoginUser<T extends WhatsAppOtpLoginUser>(
  phone: string,
  lookup: WhatsAppOtpLoginUserLookup<T>
): Promise<T | null> {
  const normalized = normalizeIndianMobileNumber(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) return null;

  const verifiedPhone = `+91${normalized}`;
  const verifiedUser = await lookup.findVerifiedPhone(verifiedPhone);
  if (verifiedUser) {
    return verifiedUser.status === "ACTIVE" && verifiedUser.role === "CUSTOMER"
      ? verifiedUser
      : null;
  }

  const phoneCandidates = [
    normalized,
    `0${normalized}`,
    verifiedPhone,
    `91${normalized}`,
  ];
  const legacyUsers = await lookup.findLegacyUsers(phoneCandidates);
  if (
    legacyUsers.length !== 1 ||
    legacyUsers[0].status !== "ACTIVE" ||
    legacyUsers[0].role !== "CUSTOMER"
  ) {
    return null;
  }
  return legacyUsers[0];
}

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

export function isWhatsAppOtpChallengeReusable(
  challenge: {
    codeHash: string | null;
    attempts: number;
    expiresAt: Date;
    resendAfter: Date;
    verifiedAt: Date | null;
    consumedAt: Date | null;
  },
  now = new Date()
): boolean {
  return Boolean(
    challenge.codeHash &&
      !challenge.verifiedAt &&
      !challenge.consumedAt &&
      isWhatsAppOtpAttemptAllowed(challenge.attempts) &&
      !isWhatsAppOtpExpired(challenge.expiresAt, now)
  );
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
