import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations/checkout";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const parsed = addressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid address" }, { status: 400 });
  }

  const address = await prisma.address.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ address });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Used to set an address as the default one.
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return NextResponse.json({ ok: true });
}
