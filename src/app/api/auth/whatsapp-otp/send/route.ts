import { NextResponse } from "next/server";
import { z } from "zod";
import { indianMobileNumberSchema } from "@/lib/validations/phone";
import { signupSchema } from "@/lib/validations/auth";
import { getWhatsAppOtpRequestIp } from "@/server/auth/whatsapp-otp-core";
import {
  sendWhatsAppOtpChallenge,
  WhatsAppOtpError,
} from "@/server/auth/whatsapp-otp";
import {
  isWhatsAppOtpConfigured,
  isWhatsAppOtpRealDeliveryEnabled,
} from "@/server/whatsapp/otp-delivery";

const sendRequestSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("LOGIN"),
    phone: indianMobileNumberSchema,
  }).strict(),
  z.object({
    purpose: z.literal("REGISTER"),
    registration: signupSchema,
    resend: z.boolean().optional(),
  }).strict(),
]);

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 16_384) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  if (!isWhatsAppOtpConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp verification is not configured yet. Please use another sign-in method." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = sendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter valid verification details." },
      { status: 400 }
    );
  }

  try {
    const registration = parsed.data.purpose === "REGISTER"
      ? {
          name: parsed.data.registration.name,
          email: parsed.data.registration.email,
          phone: parsed.data.registration.phone,
          password: parsed.data.registration.password,
        }
      : undefined;
    const phone = parsed.data.purpose === "REGISTER"
      ? parsed.data.registration.phone
      : parsed.data.phone;
    const result = await sendWhatsAppOtpChallenge({
      phone,
      purpose: parsed.data.purpose,
      ip: getWhatsAppOtpRequestIp(req.headers),
      registration,
      resend: parsed.data.purpose === "REGISTER" ? parsed.data.resend : undefined,
    });

    if (
      parsed.data.purpose === "LOGIN" &&
      result.notRegistered &&
      process.env.NODE_ENV !== "production"
    ) {
      return NextResponse.json(
        { error: "No active customer account was found for this number. Sign up or use the phone number on your account." },
        { status: 404 }
      );
    }

    if (
      result.delivery === "not-sent" &&
      result.deliveryAttempted &&
      isWhatsAppOtpRealDeliveryEnabled()
    ) {
      return NextResponse.json(
        {
          error: "Meta did not accept the WhatsApp message. Check the server configuration and delivery logs before retrying.",
          ...(result.deliveryHttpStatus ? { providerStatus: result.deliveryHttpStatus } : {}),
          ...(result.deliveryProviderCode ? { providerCode: result.deliveryProviderCode } : {}),
        },
        { status: 503 }
      );
    }

    const message = result.activeChallenge
      ? "A verification code was already requested recently. Enter that code here; no additional WhatsApp message was sent."
      : result.delivery === "mocked"
      ? "Development mock mode: no WhatsApp message was sent and no OTP is displayed."
      : result.delivery === "accepted"
        ? "Meta accepted the WhatsApp message request. Check WhatsApp for the code; delivery may still be delayed."
        : result.delivery === "not-sent"
          ? "No WhatsApp message was sent for this request. If the number is eligible, wait and try again."
        : "If this number is eligible, a verification code may be sent. If you do not receive one, wait for the resend timer and try again.";

    return NextResponse.json(
      {
        challengeId: result.challengeId,
        delivery: result.delivery,
        message,
        ...(result.activeChallenge
          ? { activeChallenge: true, resendAfter: result.resendAfter?.toISOString() }
          : {}),
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof WhatsAppOtpError && error.code === "rate-limited") {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait before trying again." },
        { status: 429 }
      );
    }
    if (error instanceof WhatsAppOtpError && error.code === "unavailable") {
      return NextResponse.json(
        { error: "WhatsApp verification is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    console.error("[whatsapp-otp] unable to create verification challenge");
    return NextResponse.json(
      { error: "Unable to send a verification code right now. Please try again later." },
      { status: 503 }
    );
  }
}
