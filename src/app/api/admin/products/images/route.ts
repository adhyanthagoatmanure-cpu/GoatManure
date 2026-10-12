import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  IMAGE_LIMIT_BYTES,
  PRODUCT_IMAGE_REQUEST_LIMIT_BYTES,
  createR2ImageStore,
  imageExtensionForMime,
  imageMimeFromBytes,
  imageStorageFailureDetails,
  managedImageKey,
  storeImage,
} from "@/server/storage/image-storage";
import { deleteManagedImagesIfUnreferenced } from "@/server/storage/image-references";

export async function POST(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > PRODUCT_IMAGE_REQUEST_LIMIT_BYTES) {
    return NextResponse.json({ error: "The total image upload must be smaller than 55 MB" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "Select at least one image" }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: "You can upload up to 10 images at once" }, { status: 400 });

  const payloads: { bytes: Uint8Array; contentType: string }[] = [];
  let totalBytes = 0;
  for (const file of files) {
    if (!imageExtensionForMime(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
    }
    if (file.size === 0 || file.size > IMAGE_LIMIT_BYTES) {
      return NextResponse.json({ error: "Each image must be smaller than 5 MB" }, { status: 400 });
    }
    totalBytes += file.size;
    if (totalBytes > PRODUCT_IMAGE_REQUEST_LIMIT_BYTES) {
      return NextResponse.json({ error: "The total image upload must be smaller than 55 MB" }, { status: 413 });
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Could not read an uploaded image" }, { status: 400 });
    }
    if (imageMimeFromBytes(bytes) !== file.type) {
      return NextResponse.json({ error: "Image content does not match its file type" }, { status: 400 });
    }
    payloads.push({ bytes, contentType: file.type });
  }

  let store: ReturnType<typeof createR2ImageStore> | undefined;
  const urls: string[] = [];
  try {
    store = createR2ImageStore();
    for (const payload of payloads) {
      const image = await storeImage(store, "products", payload.bytes, payload.contentType);
      urls.push(image.url);
    }
  } catch (error) {
    try {
      if (urls.length > 0 && store) await deleteManagedImagesIfUnreferenced(urls, store);
    } catch {
      console.error("[image-storage] Failed to clean up a partially completed product upload");
    }
    console.error("[image-storage] Product image upload failed", imageStorageFailureDetails(error));
    return NextResponse.json({ error: "Could not store product images" }, { status: 503 });
  }

  return NextResponse.json({ urls }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.urls) || body.urls.length > 20 || body.urls.some((url: unknown) => typeof url !== "string")) {
    return NextResponse.json({ error: "Provide up to 20 image URLs" }, { status: 400 });
  }
  if (body.urls.some((url: string) => !managedImageKey(url)?.startsWith("uploads/products/"))) {
    return NextResponse.json({ error: "Only uploaded product images can be released here" }, { status: 400 });
  }
  const result = await deleteManagedImagesIfUnreferenced(body.urls);
  return NextResponse.json({ ok: result.failed.length === 0, ...result }, { status: result.failed.length ? 503 : 200 });
}
