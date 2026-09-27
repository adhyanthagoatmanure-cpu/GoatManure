import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { testimonialSchema } from "@/lib/validations/admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = testimonialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid testimonial" }, { status: 400 });

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { ...parsed.data, location: parsed.data.location || null, image: parsed.data.image || null },
  });
  return NextResponse.json({ testimonial });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
