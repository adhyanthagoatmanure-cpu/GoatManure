import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { blogPostSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const parsed = blogPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post" }, { status: 400 });
  const data = parsed.data;
  if (data.status === "PUBLISHED" && !data.featuredImage) {
    return NextResponse.json({ error: "Upload a featured image before publishing the article" }, { status: 400 });
  }
  const slug = data.slug?.trim() || slugify(data.title);

  const conflict = await prisma.blogPost.findFirst({ where: { slug, NOT: { id } } });
  if (conflict) return NextResponse.json({ error: "Another post already uses this URL slug" }, { status: 409 });

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...data,
      slug,
      featuredImage: data.featuredImage || null,
      category: data.category || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      publishedAt: data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt,
    },
  });
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
