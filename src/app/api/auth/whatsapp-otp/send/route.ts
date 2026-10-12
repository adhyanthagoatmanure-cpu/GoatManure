import { NextResponse } from "next/server";
import { z } from "zod";
import { indianMobileNumberSchema } from "@/lib/validations/phone";
import { signupSchema } from "@/lib/validations/auth";
import { getWhatsAppOtpRequestIp } from "@/server/auth/whatsapp-otp-core";
import {
  sendWhatsAppOtpChallenge,
  WhatsAppOtpError,
} from "@/server/auth/whatsapp-otp";
import { isWhatsAppOtpConfigured } from "@/server/whatsapp/otp-delivery";

const sendRequestSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("LOGIN"),
    phone: indianMobileNumberSchema,
  }).strict(),
  z.object({
    purpose: z.literal("REGISTER"),
    registration: signupSchema,
  }).strict(),
]);

const GENERIC_SEND_MESSAGE =
  process.env.NODE_ENV === "production"
    ? "If this number is eligible, a verification code may be sent. If you do not receive one, wait for the resend timer and try again."
    : "Development mock mode: no WhatsApp message was sent and no OTP is displayed.";

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
    });

    return NextResponse.json(
      { challengeId: result.challengeId, message: GENERIC_SEND_MESSAGE },
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
