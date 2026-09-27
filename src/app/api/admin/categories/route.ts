import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { categorySchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  const category = await prisma.category.create({ data: { ...parsed.data, slug } });
  return NextResponse.json({ category }, { status: 201 });
}
