import { prisma } from "@/lib/prisma";
import type { ImageObjectStore } from "@/server/storage/image-storage";

export function createDatabaseImageStore(): ImageObjectStore {
  return {
    async put(key, body, contentType) {
      await prisma.storedImage.upsert({
        where: { key },
        create: { key, body: Buffer.from(body), contentType },
        update: { body: Buffer.from(body), contentType },
      });
    },
    async get(key) {
      const image = await prisma.storedImage.findUnique({
        where: { key },
        select: { body: true, contentType: true },
      });
      return image ? { body: image.body, contentType: image.contentType } : null;
    },
    async head(key) {
      const image = await prisma.storedImage.findUnique({
        where: { key },
        select: { contentType: true },
      });
      return image?.contentType ?? null;
    },
    async delete(key) {
      await prisma.storedImage.deleteMany({ where: { key } });
    },
    async list(prefix, continuationToken) {
      const objects = await prisma.storedImage.findMany({
        where: {
          key: {
            startsWith: prefix,
            ...(continuationToken ? { gt: continuationToken } : {}),
          },
        },
        orderBy: { key: "asc" },
        take: 100,
        select: { key: true, contentType: true },
      });
      const lastKey = objects.at(-1)?.key;
      const hasMore = objects.length === 100;
      return {
        objects,
        ...(hasMore && lastKey ? { continuationToken: lastKey } : {}),
      };
    },
  };
}
