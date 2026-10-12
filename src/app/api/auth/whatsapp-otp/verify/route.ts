import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminNotification } from "@/server/services/admin-notification.service";
import {
  getWhatsAppOtpRequestIp,
} from "@/server/auth/whatsapp-otp-core";
import {
  verifyWhatsAppOtpChallenge,
  WhatsAppOtpError,
} from "@/server/auth/whatsapp-otp";

const verifyRequestSchema = z.object({
  challengeId: z.string().uuid(),
  purpose: z.enum(["REGISTER", "LOGIN"]),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
}).strict();

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 4096) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid verification code." },
      { status: 400 }
    );
  }

  try {
    const result = await verifyWhatsAppOtpChallenge({
      ...parsed.data,
      ip: getWhatsAppOtpRequestIp(req.headers),
    });

    if (parsed.data.purpose === "REGISTER" && result.registrationUserId) {
      try {
        await createAdminNotification({
          type: "CUSTOMER",
          title: "New customer registered",
          message: "A customer completed phone-verified registration",
          href: "/admin/customers",
        });
      } catch {
        console.error("[whatsapp-otp] registration notification failed");
      }
      return NextResponse.json({ success: true });
    }

    if (parsed.data.purpose === "LOGIN" && result.authenticationTicket) {
      return NextResponse.json({
        success: true,
        authenticationTicket: result.authenticationTicket,
      });
    }

    return NextResponse.json({ error: "The code is invalid or expired. Request a new code." }, { status: 400 });
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
    if (error instanceof WhatsAppOtpError && error.code === "invalid") {
      return NextResponse.json(
        { error: "The code is invalid or expired. Request a new code." },
        { status: 400 }
      );
    }
    console.error("[whatsapp-otp] unable to verify code");
    return NextResponse.json(
      { error: "Unable to verify the code right now. Please try again later." },
      { status: 503 }
    );
  }
}
