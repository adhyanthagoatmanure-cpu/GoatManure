import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getId(params: Promise<{ id: string }>) {
  return params.then(({ id }) => id);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blogPostId = await getId(params);
  const comments = await prisma.blogComment.findMany({
    where: { blogPostId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, authorName: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blogPostId = await getId(params);
  const body = await req.json().catch(() => null) as { name?: unknown; email?: unknown; comment?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (comment.length < 3 || comment.length > 2000) return NextResponse.json({ error: "Comment must be between 3 and 2,000 characters." }, { status: 400 });

  const post = await prisma.blogPost.findFirst({ where: { id: blogPostId, status: "PUBLISHED" }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Blog post not found." }, { status: 404 });

  const created = await prisma.blogComment.create({
    data: { blogPostId, authorName: name, authorEmail: email, comment },
    select: { id: true, authorName: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ comment: created }, { status: 201 });
}
