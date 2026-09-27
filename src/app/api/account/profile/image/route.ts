import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png" };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a profile image" }, { status: 400 });
  if (!TYPES[file.type]) return NextResponse.json({ error: "Only JPG and PNG images are allowed" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Image must be smaller than 2 MB" }, { status: 400 });

  const directory = path.join(process.cwd(), "public", "images", "profiles", "uploads");
  await mkdir(directory, { recursive: true });
  const filename = `${crypto.randomUUID()}${TYPES[file.type]}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  const image = `/images/profiles/uploads/${filename}`;
  await prisma.user.update({ where: { id: session.user.id }, data: { image } });
  return NextResponse.json({ image }, { status: 201 });
}
