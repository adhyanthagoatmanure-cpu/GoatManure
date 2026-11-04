import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/utils";
import { getEmailService, passwordResetEmail } from "@/server/email/email-service";

export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success, whether or not the account exists — this is
  // deliberate so the endpoint can't be used to enumerate registered emails.
  if (user && user.passwordHash) {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "";
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
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const tpl = passwordResetEmail(resetUrl);
    await getEmailService().send({ to: user.email, ...tpl });
  }

  return NextResponse.json({ ok: true });
}
