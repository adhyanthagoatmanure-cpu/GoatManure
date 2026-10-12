import { NextResponse } from "next/server";
import { createR2ImageStore, managedImageKey } from "@/server/storage/image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; filename: string }> },
) {
  const { kind, filename } = await params;
  const key = managedImageKey(`/api/storage/${kind}/${filename}`);
  if (!key) return new NextResponse(null, { status: 404 });

  try {
    const image = await createR2ImageStore().get(key);
    if (!image) return new NextResponse(null, { status: 404 });

    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = image.contentType === MIME_BY_EXTENSION[extension]
      ? image.contentType
      : MIME_BY_EXTENSION[extension];
    const body = new ArrayBuffer(image.body.byteLength);
    new Uint8Array(body).set(image.body);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(image.body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error(`[image-storage] Failed to retrieve managed image ${key}`);
    return new NextResponse("Image storage is temporarily unavailable", { status: 503 });
  }
}
