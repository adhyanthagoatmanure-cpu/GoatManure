import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/server/auth/password-reset-token";
import { getEmailService, passwordResetEmail } from "@/server/email/email-service";

export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success, whether or not the account exists — this is
  // deliberate so the endpoint can't be used to enumerate registered emails.
  if (user && user.passwordHash) {
    const token = generatePasswordResetToken();
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
      || process.env.NEXTAUTH_URL?.trim()
      || "";
    const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const requestProtocol = req.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
    const usesLocalRequestHost =
      requestHost !== null &&
      /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestHost.split(",")[0].trim());
    const siteUrl = (
      usesLocalRequestHost && requestHost
        ? `${requestProtocol}://${requestHost.split(",")[0].trim()}`
        : configuredUrl
    ).replace(/\/$/, "");
    let parsedSiteUrl: URL;
    try {
      parsedSiteUrl = new URL(siteUrl);
    } catch {
      console.error("PASSWORD RESET URL CONFIGURATION INVALID");
      return NextResponse.json({ ok: true });
    }
    if (
      parsedSiteUrl.protocol !== "https:" &&
      parsedSiteUrl.hostname !== "localhost" &&
      parsedSiteUrl.hostname !== "127.0.0.1"
    ) {
      console.error("PASSWORD RESET URL MUST USE HTTPS");
      return NextResponse.json({ ok: true });
    }
    const resetUrl = new URL("/reset-password", parsedSiteUrl);
    resetUrl.searchParams.set("token", token);
    const tpl = passwordResetEmail(resetUrl.toString());
    const tokenHash = hashPasswordResetToken(token);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      const result = await getEmailService().send({ to: user.email, ...tpl });
      if (!result.sent) {
        console.error("PASSWORD RESET EMAIL NOT ACCEPTED", JSON.stringify({
          acceptedCount: result.accepted.length,
          rejectedCount: result.rejected.length,
        }));
      }
    } catch (error) {
      console.error("PASSWORD RESET EMAIL DELIVERY FAILED", JSON.stringify({
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
    }
  } else {
    console.info("PASSWORD RESET EMAIL SKIPPED", JSON.stringify({
      reason: user ? "password_auth_unavailable" : "no_matching_password_account",
    }));
  }

  return NextResponse.json({ ok: true });
}
