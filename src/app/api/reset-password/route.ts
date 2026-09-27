import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";

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
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
