import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDatabaseImageStore } from "@/server/storage/database-image-store";
import {
  imageExtensionForMime,
  imageMimeFromBytes,
  storeImage,
} from "@/server/storage/image-storage";
import { deleteManagedImagesIfUnreferenced } from "@/server/storage/image-references";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a profile image" }, { status: 400 });
  if (!["image/jpeg", "image/png"].includes(file.type)) return NextResponse.json({ error: "Only JPG and PNG images are allowed" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Image must be smaller than 2 MB" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageExtensionForMime(file.type) || imageMimeFromBytes(bytes) !== file.type) {
    return NextResponse.json({ error: "Image content does not match its file type" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let uploadedUrl: string | undefined;
  try {
    const stored = await storeImage(createDatabaseImageStore(), "profiles", bytes, file.type);
    uploadedUrl = stored.url;
    await prisma.user.update({ where: { id: session.user.id }, data: { image: stored.url } });
  } catch {
    if (uploadedUrl) {
      try {
        await deleteManagedImagesIfUnreferenced([uploadedUrl]);
      } catch {
        console.error("[image-storage] Failed to clean up a profile image after a database failure");
      }
    }
    console.error("[image-storage] Profile image upload or save failed");
    return NextResponse.json({ error: "Could not save profile image" }, { status: 503 });
  }

  if (existing.image && existing.image !== uploadedUrl) {
    try {
      await deleteManagedImagesIfUnreferenced([existing.image]);
    } catch {
      console.error("[image-storage] Failed to clean up a replaced profile image");
    }
  }
  return NextResponse.json({ image: uploadedUrl }, { status: 201 });
}
