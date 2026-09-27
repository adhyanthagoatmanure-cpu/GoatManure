import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
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
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "Select at least one image" }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: "You can upload up to 10 images at once" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "public", "images", "products", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Each image must be smaller than 5 MB" }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}${EXTENSIONS[file.type]}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    urls.push(`/images/products/uploads/${filename}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
