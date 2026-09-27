import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations/checkout";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = addressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid address" }, { status: 400 });
  }

  const existingCount = await prisma.address.count({ where: { userId: session.user.id } });
  const address = await prisma.address.create({
    data: { ...parsed.data, userId: session.user.id, isDefault: existingCount === 0 },
  });
  return NextResponse.json({ address }, { status: 201 });
}
