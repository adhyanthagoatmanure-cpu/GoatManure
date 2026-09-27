import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select an image to upload" }, { status: 400 });
  }
  if (!EXTENSIONS[file.type]) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "The image must be smaller than 5 MB" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "images", "blog", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}${EXTENSIONS[file.type]}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/images/blog/uploads/${filename}` }, { status: 201 });
}
