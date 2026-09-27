import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ messages });
}
