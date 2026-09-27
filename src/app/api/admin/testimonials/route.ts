import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { testimonialSchema } from "@/lib/validations/admin";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ testimonials });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = testimonialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid testimonial" }, { status: 400 });

  const testimonial = await prisma.testimonial.create({
    data: { ...parsed.data, location: parsed.data.location || null, image: parsed.data.image || null },
  });
  return NextResponse.json({ testimonial }, { status: 201 });
}
