import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeIndianMobileNumber } from "@/lib/validations/phone";
import {
  generateWhatsAppOtp,
  generateWhatsAppOtpChallengeId,
  findEligibleWhatsAppOtpLoginUser,
  hashWhatsAppOtp,
  hashWhatsAppOtpTicket,
  isWhatsAppOtpExpired,
  isWhatsAppOtpChallengeReusable,
  isWhatsAppOtpHashMatch,
  isWhatsAppOtpAttemptAllowed,
  WHATSAPP_OTP_MAX_ATTEMPTS,
  WHATSAPP_OTP_RESEND_MS,
  WHATSAPP_OTP_TICKET_TTL_MS,
  WHATSAPP_OTP_TTL_MS,
  type WhatsAppOtpPurpose,
} from "./whatsapp-otp-core";
import {
  isWhatsAppOtpRealDeliveryEnabled,
  sendWhatsAppOtp,
  WhatsAppOtpDeliveryError,
} from "@/server/whatsapp/otp-delivery";

const OTP_WINDOW_MS = 60 * 60 * 1000;
const OTP_PHONE_SEND_LIMIT = 3;
const OTP_IP_SEND_LIMIT = 12;
const OTP_IP_VERIFY_LIMIT = 30;
const OTP_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

export type WhatsAppOtpErrorCode = "unavailable" | "rate-limited" | "invalid";

export class WhatsAppOtpError extends Error {
  constructor(readonly code: WhatsAppOtpErrorCode) {
    super(code);
    this.name = "WhatsAppOtpError";
  }
}

export interface WhatsAppOtpRegistrationInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface StoredWhatsAppOtpRegistration {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}

function getOtpSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) throw new WhatsAppOtpError("unavailable");
  return secret;
}

function toE164(phone: string): string {
  return `+91${phone}`;
}

function localPhoneCandidates(phone: string): string[] {
  const normalized = normalizeIndianMobileNumber(phone);
  return [...new Set([normalized, `0${normalized}`, `+91${normalized}`, `91${normalized}`])];
}

function rateBucketHash(secret: string, value: string): string {
  return hashWhatsAppOtpTicket(secret, `rate:${value}`);
}

async function consumeRateLimit(
  bucketKey: string,
  maxCount: number,
  now: Date
): Promise<boolean> {
  const windowCutoff = new Date(now.getTime() - OTP_WINDOW_MS);
  await prisma.$executeRaw`
    INSERT INTO \`whatsapp_otp_rate_limits\` (\`bucketKey\`, \`windowStartedAt\`, \`count\`, \`updatedAt\`)
    VALUES (${bucketKey}, ${now}, 1, ${now})
    ON DUPLICATE KEY UPDATE
      \`count\` = IF(\`windowStartedAt\` <= ${windowCutoff}, 1, \`count\` + 1),
      \`windowStartedAt\` = IF(\`windowStartedAt\` <= ${windowCutoff}, ${now}, \`windowStartedAt\`),
      \`updatedAt\` = ${now}
  `;
  const record = await prisma.whatsAppOtpRateLimit.findUnique({ where: { bucketKey } });
  return Boolean(record && record.count <= maxCount);
}

async function enforceSendLimits(phone: string, ip: string, now: Date): Promise<void> {
  const secret = getOtpSecret();
  const [phoneAllowed, ipAllowed] = await Promise.all([
    consumeRateLimit(rateBucketHash(secret, `send:phone:${phone}`), OTP_PHONE_SEND_LIMIT, now),
    consumeRateLimit(rateBucketHash(secret, `send:ip:${ip}`), OTP_IP_SEND_LIMIT, now),
  ]);
  if (!phoneAllowed || !ipAllowed) throw new WhatsAppOtpError("rate-limited");
}

async function enforceVerifyLimit(ip: string, now: Date): Promise<void> {
  const secret = getOtpSecret();
  const allowed = await consumeRateLimit(
    rateBucketHash(secret, `verify:ip:${ip}`),
    OTP_IP_VERIFY_LIMIT,
    now
  );
  if (!allowed) throw new WhatsAppOtpError("rate-limited");
}

async function cleanExpiredOtpRecords(now: Date): Promise<void> {
  const expiredChallenges = await prisma.whatsAppOtpChallenge.findMany({
    where: { expiresAt: { lte: now } },
    orderBy: { expiresAt: "asc" },
    take: 100,
    select: { id: true },
  });
  if (expiredChallenges.length > 0) {
    await prisma.whatsAppOtpChallenge.deleteMany({
      where: { id: { in: expiredChallenges.map(({ id }) => id) } },
    });
  }

  const staleRateLimits = await prisma.whatsAppOtpRateLimit.findMany({
    where: { windowStartedAt: { lte: new Date(now.getTime() - OTP_RATE_LIMIT_RETENTION_MS) } },
    take: 100,
    select: { bucketKey: true },
  });
  if (staleRateLimits.length > 0) {
    await prisma.whatsAppOtpRateLimit.deleteMany({
      where: { bucketKey: { in: staleRateLimits.map(({ bucketKey }) => bucketKey) } },
    });
  }
}

async function findLoginUser(phone: string) {
  return findEligibleWhatsAppOtpLoginUser(phone, {
    findVerifiedPhone: (verifiedPhone) => prisma.user.findUnique({
      where: { verifiedPhone },
      select: { id: true, status: true, role: true },
    }),
    findLegacyUsers: (phoneCandidates) => prisma.user.findMany({
      where: {
        phone: { in: phoneCandidates },
        verifiedPhone: null,
      },
      take: 2,
      select: { id: true, status: true, role: true },
    }),
  });
}

async function isRegistrationAvailable(email: string, phone: string): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { verifiedPhone: toE164(phone) },
        { phone: { in: localPhoneCandidates(phone) } },
      ],
    },
    select: { id: true },
  });
  return !existing;
}

async function findReusableRegistrationChallenge(
  phone: string,
  registration: WhatsAppOtpRegistrationInput,
  now: Date,
  resend: boolean
): Promise<{ id: string; resendAfter: Date } | null> {
  if (!isWhatsAppOtpRealDeliveryEnabled()) return null;

  const challenge = await prisma.whatsAppOtpChallenge.findUnique({
    where: { phone_purpose: { phone, purpose: "REGISTER" } },
    select: {
      id: true,
      codeHash: true,
      attempts: true,
      expiresAt: true,
      resendAfter: true,
      verifiedAt: true,
      consumedAt: true,
      registrationName: true,
      registrationEmail: true,
      registrationPasswordHash: true,
    },
  });
  if (
    !challenge ||
    !isWhatsAppOtpChallengeReusable(challenge, now) ||
    (resend && challenge.resendAfter.getTime() <= now.getTime()) ||
    challenge.registrationName !== registration.name ||
    challenge.registrationEmail !== registration.email ||
    !challenge.registrationPasswordHash ||
    !(await bcrypt.compare(registration.password, challenge.registrationPasswordHash))
  ) {
    return null;
  }
  return { id: challenge.id, resendAfter: challenge.resendAfter };
}

async function upsertChallenge(input: {
  candidateId: string;
  phone: string;
  purpose: WhatsAppOtpPurpose;
  code: string;
  secret: string;
  userId?: string;
  registration?: StoredWhatsAppOtpRegistration;
  now: Date;
}): Promise<string | null> {
  const existing = await prisma.whatsAppOtpChallenge.findUnique({
    where: { phone_purpose: { phone: input.phone, purpose: input.purpose } },
    select: { id: true, resendAfter: true },
  });
  if (existing && existing.resendAfter.getTime() > input.now.getTime()) return null;
  const challengeId = existing?.id ?? input.candidateId;
  const codeHash = hashWhatsAppOtp(
    input.secret,
    challengeId,
    input.purpose,
    input.phone,
    input.code
  );

  const data = {
    phone: input.phone,
    purpose: input.purpose,
    codeHash,
    userId: input.userId ?? null,
    registrationName: input.registration?.name ?? null,
    registrationEmail: input.registration?.email ?? null,
    registrationPasswordHash: input.registration?.passwordHash ?? null,
    attempts: 0,
    resendAfter: new Date(input.now.getTime() + WHATSAPP_OTP_RESEND_MS),
    expiresAt: new Date(input.now.getTime() + WHATSAPP_OTP_TTL_MS),
    verifiedAt: null,
    authTicketHash: null,
    authTicketExpiresAt: null,
    consumedAt: null,
    updatedAt: input.now,
  };

  if (existing) {
    const changed = await prisma.whatsAppOtpChallenge.updateMany({
      where: { id: existing.id, resendAfter: { lte: input.now } },
      data,
    });
    return changed.count === 1 ? challengeId : null;
  }

  try {
    await prisma.whatsAppOtpChallenge.create({ data: { id: challengeId, ...data } });
    return challengeId;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function sendWhatsAppOtpChallenge(input: {
  phone: string;
  purpose: WhatsAppOtpPurpose;
  ip: string;
  userId?: string;
  registration?: WhatsAppOtpRegistrationInput;
  resend?: boolean;
}): Promise<{
  challengeId: string;
  sent: boolean;
  delivery: "accepted" | "mocked" | "not-sent";
  deliveryAttempted?: boolean;
  activeChallenge?: boolean;
  resendAfter?: Date;
  deliveryHttpStatus?: number;
  deliveryProviderCode?: number;
  notRegistered?: boolean;
}> {
  const now = new Date();
  const candidateId = generateWhatsAppOtpChallengeId();
  const normalizedPhone = toE164(input.phone);
  const secret = getOtpSecret();
  if (input.purpose === "REGISTER" && input.registration) {
    const reusableChallenge = await findReusableRegistrationChallenge(
      normalizedPhone,
      input.registration,
      now,
      input.resend ?? false
    );
    if (reusableChallenge) {
      return {
        challengeId: reusableChallenge.id,
        sent: false,
        delivery: "not-sent",
        activeChallenge: true,
        resendAfter: reusableChallenge.resendAfter,
      };
    }
  }
  await enforceSendLimits(normalizedPhone, input.ip, now);
  await cleanExpiredOtpRecords(now);

  let userId: string | undefined;
  let eligible = false;
  if (input.purpose === "LOGIN") {
    const user = await findLoginUser(input.phone);
    userId = user?.id;
    eligible = Boolean(user);
    if (!eligible) {
      return {
        challengeId: candidateId,
        sent: false,
        delivery: "not-sent",
        notRegistered: true,
      };
    }
  } else if (input.purpose === "PROFILE") {
    const user = input.userId
      ? await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, status: true } })
      : null;
    eligible = Boolean(user && user.status === "ACTIVE");
    userId = user?.id;
  } else {
    eligible = Boolean(input.registration) &&
      await isRegistrationAvailable(input.registration?.email ?? "", input.phone);
  }

  if (!eligible) return { challengeId: candidateId, sent: false, delivery: "not-sent" };

  const code = generateWhatsAppOtp();
  const registration = input.registration
    ? {
        name: input.registration.name,
        email: input.registration.email,
        phone: input.registration.phone,
        passwordHash: await bcrypt.hash(input.registration.password, 12),
      }
    : undefined;
  const challengeId = await upsertChallenge({
    candidateId,
    phone: normalizedPhone,
    purpose: input.purpose,
    code,
    secret,
    userId,
    registration,
    now,
  });
  if (!challengeId) return { challengeId: candidateId, sent: false, delivery: "not-sent" };

  try {
    const delivery = await sendWhatsAppOtp(normalizedPhone, code);
    return { challengeId, sent: delivery === "sent", delivery: delivery === "sent" ? "accepted" : "mocked" };
  } catch (error) {
    await prisma.whatsAppOtpChallenge.updateMany({
      where: {
        id: challengeId,
        codeHash: hashWhatsAppOtp(secret, challengeId, input.purpose, normalizedPhone, code),
      },
      data: { codeHash: null, expiresAt: now, consumedAt: now },
    });
    const providerStatus =
      error instanceof WhatsAppOtpDeliveryError ? error.httpStatus ?? "unavailable" : "unknown";
    const providerCode =
      error instanceof WhatsAppOtpDeliveryError ? error.providerCode ?? "unavailable" : "unknown";
    const providerMessage = error instanceof WhatsAppOtpDeliveryError ? error.providerMessage ?? "unavailable" : "unknown";
    const providerSubcode = error instanceof WhatsAppOtpDeliveryError ? error.providerSubcode ?? "unavailable" : "unknown";
    console.error(`[whatsapp-otp] message delivery failed status=${providerStatus} code=${providerCode} subcode=${providerSubcode} message=${providerMessage}`);
    return {
      challengeId: candidateId,
      sent: false,
      delivery: "not-sent",
      deliveryAttempted: true,
      deliveryHttpStatus:
        error instanceof WhatsAppOtpDeliveryError ? error.httpStatus : undefined,
      deliveryProviderCode:
        error instanceof WhatsAppOtpDeliveryError ? error.providerCode : undefined,
    };
  }
}

async function getChallengeForVerification(
  challengeId: string,
  purpose: WhatsAppOtpPurpose,
  code: string,
  now: Date
) {
  const challenge = await prisma.whatsAppOtpChallenge.findUnique({
    where: { id: challengeId },
  });
  if (
    !challenge ||
    challenge.purpose !== purpose ||
    !challenge.codeHash ||
    challenge.verifiedAt ||
    challenge.consumedAt ||
    isWhatsAppOtpExpired(challenge.expiresAt, now) ||
    !isWhatsAppOtpAttemptAllowed(challenge.attempts)
  ) {
    throw new WhatsAppOtpError("invalid");
  }

  const expected = hashWhatsAppOtp(
    getOtpSecret(),
    challenge.id,
    purpose,
    challenge.phone,
    code
  );
  if (!isWhatsAppOtpHashMatch(challenge.codeHash, expected)) {
    await prisma.whatsAppOtpChallenge.updateMany({
      where: {
        id: challenge.id,
        purpose,
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: WHATSAPP_OTP_MAX_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    });
    throw new WhatsAppOtpError("invalid");
  }
  return challenge;
}

export async function verifyWhatsAppOtpChallenge(input: {
  challengeId: string;
  purpose: WhatsAppOtpPurpose;
  code: string;
  ip: string;
  userId?: string;
}): Promise<{ registrationUserId?: string; authenticationTicket?: string; profileVerified?: boolean }> {
  const now = new Date();
  await enforceVerifyLimit(input.ip, now);
  await cleanExpiredOtpRecords(now);
  const challenge = await getChallengeForVerification(
    input.challengeId,
    input.purpose,
    input.code,
    now
  );
  const secret = getOtpSecret();

  if (input.purpose === "PROFILE") {
    if (!input.userId || challenge.userId !== input.userId) throw new WhatsAppOtpError("invalid");
    try {
      const claimed = await prisma.whatsAppOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          purpose: "PROFILE",
          userId: input.userId,
          codeHash: challenge.codeHash,
          verifiedAt: null,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: WHATSAPP_OTP_MAX_ATTEMPTS },
        },
        data: { verifiedAt: now, consumedAt: now, codeHash: null },
      });
      if (claimed.count !== 1) throw new WhatsAppOtpError("invalid");
      await prisma.user.update({
        where: { id: input.userId },
        data: { phone: challenge.phone.slice(3), verifiedPhone: challenge.phone, phoneVerifiedAt: now },
      });
      return { profileVerified: true };
    } catch (error) {
      if (error instanceof WhatsAppOtpError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new WhatsAppOtpError("invalid");
      }
      throw error;
    }
  }

  if (input.purpose === "REGISTER") {
    try {
      const user = await prisma.$transaction(async (tx) => {
        const claim = await tx.whatsAppOtpChallenge.updateMany({
          where: {
            id: challenge.id,
            purpose: "REGISTER",
            codeHash: challenge.codeHash,
            verifiedAt: null,
            consumedAt: null,
            expiresAt: { gt: now },
            attempts: { lt: WHATSAPP_OTP_MAX_ATTEMPTS },
          },
          data: { verifiedAt: now, consumedAt: now, codeHash: null },
        });
        if (claim.count !== 1) throw new WhatsAppOtpError("invalid");

        const latest = await tx.whatsAppOtpChallenge.findUnique({
          where: { id: challenge.id },
        });
        if (
          !latest?.registrationName ||
          !latest.registrationEmail ||
          !latest.registrationPasswordHash
        ) {
          throw new WhatsAppOtpError("invalid");
        }

        return tx.user.create({
          data: {
            name: latest.registrationName,
            email: latest.registrationEmail,
            phone: latest.phone.slice(3),
            verifiedPhone: latest.phone,
            phoneVerifiedAt: now,
            passwordHash: latest.registrationPasswordHash,
            role: "CUSTOMER",
            status: "ACTIVE",
          },
          select: { id: true },
        });
      });
      return { registrationUserId: user.id };
    } catch (error) {
      if (error instanceof WhatsAppOtpError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new WhatsAppOtpError("invalid");
      }
      throw error;
    }
  }

  const userId = challenge.userId;
  if (!userId) throw new WhatsAppOtpError("invalid");
  const ticket = randomBytes(32).toString("base64url");
  const ticketExpiresAt = new Date(now.getTime() + WHATSAPP_OTP_TICKET_TTL_MS);
  const ticketHash = hashWhatsAppOtpTicket(secret, ticket);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, image: true, role: true, status: true, phone: true, verifiedPhone: true },
      });
      if (!user || user.status !== "ACTIVE") throw new WhatsAppOtpError("invalid");
      if (user.verifiedPhone && user.verifiedPhone !== challenge.phone) {
        throw new WhatsAppOtpError("invalid");
      }
      if (!user.verifiedPhone && !localPhoneCandidates(challenge.phone).includes(user.phone ?? "")) {
        throw new WhatsAppOtpError("invalid");
      }

      const claim = await tx.whatsAppOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          purpose: "LOGIN",
          codeHash: challenge.codeHash,
          verifiedAt: null,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: WHATSAPP_OTP_MAX_ATTEMPTS },
        },
        data: {
          verifiedAt: now,
          codeHash: null,
          authTicketHash: ticketHash,
          authTicketExpiresAt: ticketExpiresAt,
        },
      });
      if (claim.count !== 1) throw new WhatsAppOtpError("invalid");

      if (!user.verifiedPhone) {
        await tx.user.update({
          where: { id: user.id },
          data: { verifiedPhone: challenge.phone, phoneVerifiedAt: now },
        });
      }
      return { authenticationTicket: ticket };
    });
    return result;
  } catch (error) {
    if (error instanceof WhatsAppOtpError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new WhatsAppOtpError("invalid");
    }
    throw error;
  }
}

export async function consumeWhatsAppOtpLoginTicket(ticket: string) {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(ticket)) return null;
  let secret: string;
  try {
    secret = getOtpSecret();
  } catch {
    return null;
  }

  const now = new Date();
  const ticketHash = hashWhatsAppOtpTicket(secret, ticket);
  try {
    return await prisma.$transaction(async (tx) => {
      const challenge = await tx.whatsAppOtpChallenge.findUnique({
        where: { authTicketHash: ticketHash },
      });
      if (
        !challenge ||
        challenge.purpose !== "LOGIN" ||
        !challenge.userId ||
        !challenge.verifiedAt ||
        !challenge.authTicketExpiresAt ||
        isWhatsAppOtpExpired(challenge.expiresAt, now) ||
        isWhatsAppOtpExpired(challenge.authTicketExpiresAt, now) ||
        challenge.consumedAt
      ) {
        return null;
      }

      const user = await tx.user.findUnique({
        where: { id: challenge.userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          verifiedPhone: true,
          phoneVerifiedAt: true,
          role: true,
          status: true,
        },
      });
      if (!user || user.status !== "ACTIVE") return null;
      if (user.verifiedPhone && user.verifiedPhone !== challenge.phone) return null;
      if (!user.verifiedPhone && !localPhoneCandidates(challenge.phone).includes(user.phone ?? "")) {
        return null;
      }

      const claimed = await tx.whatsAppOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          authTicketHash: ticketHash,
          authTicketExpiresAt: { gt: now },
          expiresAt: { gt: now },
          consumedAt: null,
        },
        data: { consumedAt: now, authTicketHash: null },
      });
      if (claimed.count !== 1) return null;

      if (!user.verifiedPhone) {
        await tx.user.update({
          where: { id: user.id },
          data: { verifiedPhone: challenge.phone, phoneVerifiedAt: now },
        });
      }
      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
