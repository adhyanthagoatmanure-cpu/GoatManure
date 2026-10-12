import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  IMAGE_LIMIT_BYTES,
  createR2ImageStore,
  imageExtensionForMime,
  imageMimeFromBytes,
  managedImageKey,
  storeImage,
} from "@/server/storage/image-storage";
import { deleteManagedImagesIfUnreferenced } from "@/server/storage/image-references";

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select an image to upload" }, { status: 400 });
  }
  if (!imageExtensionForMime(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
  }
  if (file.size === 0 || file.size > IMAGE_LIMIT_BYTES) {
    return NextResponse.json({ error: "The image must be smaller than 5 MB" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (imageMimeFromBytes(bytes) !== file.type) {
    return NextResponse.json({ error: "Image content does not match its file type" }, { status: 400 });
  }

  try {
    const image = await storeImage(createR2ImageStore(), "blogs", bytes, file.type);
    return NextResponse.json({ url: image.url }, { status: 201 });
  } catch {
    console.error("[image-storage] Blog image upload failed");
    return NextResponse.json({ error: "Could not store blog image" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.urls) || body.urls.length > 5 || body.urls.some((url: unknown) => typeof url !== "string")) {
    return NextResponse.json({ error: "Provide up to 5 image URLs" }, { status: 400 });
  }
  if (body.urls.some((url: string) => !managedImageKey(url)?.startsWith("uploads/blogs/"))) {
    return NextResponse.json({ error: "Only uploaded blog images can be released here" }, { status: 400 });
  }
  const result = await deleteManagedImagesIfUnreferenced(body.urls);
  return NextResponse.json({ ok: result.failed.length === 0, ...result }, { status: result.failed.length ? 503 : 200 });
}
