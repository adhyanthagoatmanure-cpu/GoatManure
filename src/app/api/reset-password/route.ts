import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";

const RESET_TOKEN_UNAVAILABLE = "RESET_TOKEN_UNAVAILABLE";

export async function POST(req: Request) {
  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: record.id,
          token: parsed.data.token,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true },
      });
      if (claimed.count !== 1) {
        throw new Error(RESET_TOKEN_UNAVAILABLE);
      }
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, emailVerified: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === RESET_TOKEN_UNAVAILABLE) {
      return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
