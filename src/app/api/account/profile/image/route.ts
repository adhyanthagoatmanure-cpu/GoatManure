import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDatabaseImageStore } from "@/server/storage/database-image-store";
import { deleteManagedImagesIfUnreferenced } from "@/server/storage/image-references";
import { handleProfileImageUpload } from "@/server/storage/profile-image-upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const result = await handleProfileImageUpload(req, {
    authenticate: async () => {
      const session = await auth();
      return session?.user?.id ?? null;
    },
    findUserImage: async (userId) => prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    }),
    createStore: createDatabaseImageStore,
    saveImage: async (userId, imageUrl) => {
      await prisma.user.update({ where: { id: userId }, data: { image: imageUrl } });
    },
    deleteIfUnreferenced: deleteManagedImagesIfUnreferenced,
    logError: (message, error) => {
      const errorName = error instanceof Error ? error.name : typeof error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const code =
        error && typeof error === "object" && "code" in error &&
        typeof error.code === "string" && /^P\d{4}$/.test(error.code)
          ? error.code
          : undefined;
      const safeMessage = errorMessage
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
        .replace(/\b(?:mysql|mariadb|postgres(?:ql)?):\/\/[^\s"'`]+/gi, "[redacted database URL]")
        .slice(0, 1000);
      console.error(`[image-storage] ${message}`, {
        name: errorName,
        message: safeMessage,
        ...(code ? { code } : {}),
      });
    },
  });
  return NextResponse.json(result.body, { status: result.status });
}
