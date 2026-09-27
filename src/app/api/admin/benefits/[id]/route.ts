import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Benefit title is required." }, { status: 400 });
  }
  const benefit = await prisma.productBenefit.update({
    where: { id },
    data: { title: body.title.trim(), icon: typeof body.icon === "string" ? body.icon.trim() || null : null },
  }).catch(() => null);
  if (!benefit) return NextResponse.json({ error: "Benefit not found." }, { status: 404 });
  return NextResponse.json({ benefit });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const deleted = await prisma.productBenefit.delete({ where: { id } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Benefit not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
