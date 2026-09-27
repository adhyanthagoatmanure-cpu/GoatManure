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
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password?token=${token}`;
    const tpl = passwordResetEmail(resetUrl);
    await getEmailService().send({ to: user.email, ...tpl });
  }

  return NextResponse.json({ ok: true });
}
