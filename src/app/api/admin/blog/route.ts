import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { blogPostSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = blogPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post" }, { status: 400 });
  const data = parsed.data;
  if (data.status === "PUBLISHED" && !data.featuredImage) {
    return NextResponse.json({ error: "Upload a featured image before publishing the article" }, { status: 400 });
  }
  const slug = data.slug?.trim() || slugify(data.title);

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A post with this URL slug already exists" }, { status: 409 });

  const post = await prisma.blogPost.create({
    data: {
      ...data,
      slug,
      featuredImage: data.featuredImage || null,
      category: data.category || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
