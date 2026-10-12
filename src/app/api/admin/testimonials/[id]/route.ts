import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { testimonialSchema } from "@/lib/validations/admin";
import { deleteManagedImagesIfUnreferenced } from "@/server/storage/image-references";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = testimonialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid testimonial" }, { status: 400 });

  const existing = await prisma.testimonial.findUnique({
    where: { id },
    select: { image: true },
  });
  if (!existing) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { ...parsed.data, location: parsed.data.location || null, image: parsed.data.image || null },
  });
  if (existing.image && existing.image !== testimonial.image) {
    try {
      await deleteManagedImagesIfUnreferenced([existing.image]);
    } catch {
      console.error("[image-storage] Failed to clean up a replaced testimonial image");
    }
  }
  return NextResponse.json({ testimonial });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { image: true } });
  await prisma.testimonial.delete({ where: { id } });
  if (existing?.image) {
    try {
      await deleteManagedImagesIfUnreferenced([existing.image]);
    } catch {
      console.error("[image-storage] Failed to clean up images after testimonial deletion");
    }
  }
  return NextResponse.json({ ok: true });
}
