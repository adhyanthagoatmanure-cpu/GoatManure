import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";
import path from "node:path";

type LegacyImage = { path: string; kind: "products" | "blogs" | "profiles"; filename: string };

function getLegacyImage(value: string): LegacyImage | null {
  let pathname: string;
  try {
    pathname = new URL(value, "https://adhyantha.invalid").pathname;
  } catch {
    return null;
  }
  const match = pathname.match(
    /^\/images\/(products|blog|profiles)\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|gif))$/i,
  );
  if (!match) return null;
  return {
    path: pathname,
    kind: match[1] === "blog" ? "blogs" : match[1] as LegacyImage["kind"],
    filename: match[2],
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply" && arg !== "--dry-run") || (args.includes("--apply") && args.includes("--dry-run"))) {
    throw new Error("Usage: npm run storage:migrate-legacy [-- --dry-run|--apply]");
  }
  const apply = args.includes("--apply");
  loadEnvConfig(process.cwd());
  const [{ prisma }, { imageMimeFromBytes, storeImage, createR2ImageStore }, { normalizeProductImages }] =
    await Promise.all([
      import("../src/lib/prisma"),
      import("../src/server/storage/image-storage"),
      import("../src/lib/utils"),
    ]);

  const [products, users, blogPosts, testimonials] = await Promise.all([
    prisma.product.findMany({ select: { images: true } }),
    prisma.user.findMany({ select: { image: true } }),
    prisma.blogPost.findMany({ select: { featuredImage: true } }),
    prisma.testimonial.findMany({ select: { image: true } }),
  ]);
  const referenced = new Map<string, LegacyImage>();
  for (const value of [
    ...products.flatMap(({ images }) => normalizeProductImages(images)),
    ...users.flatMap(({ image }) => image ? [image] : []),
    ...blogPosts.flatMap(({ featuredImage }) => featuredImage ? [featuredImage] : []),
    ...testimonials.flatMap(({ image }) => image ? [image] : []),
  ]) {
    const legacy = getLegacyImage(value);
    if (legacy) referenced.set(legacy.path, legacy);
  }

  const store = createR2ImageStore();
  const replacements = new Map<string, string>();
  const uploadedUrls: string[] = [];
  let missing = 0;
  try {
    for (const legacy of referenced.values()) {
      const filePath = path.join(process.cwd(), "public", "images", legacy.kind === "blogs" ? "blog" : legacy.kind, "uploads", legacy.filename);
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await readFile(filePath));
      } catch {
        console.warn(`[image-migration] source file missing; reference preserved: ${legacy.path}`);
        missing += 1;
        continue;
      }
      const extension = path.extname(legacy.filename).toLowerCase();
      const expectedMime: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
      };
      const contentType = expectedMime[extension];
      if (!contentType || imageMimeFromBytes(bytes) !== contentType) {
        console.warn(`[image-migration] invalid or unsupported source skipped: ${legacy.path}`);
        missing += 1;
        continue;
      }
      if (!apply) {
        console.info(`[image-migration] candidate ${legacy.path}`);
        continue;
      }

      const uploaded = await storeImage(store, legacy.kind, bytes, contentType);
      replacements.set(legacy.path, uploaded.url);
      uploadedUrls.push(uploaded.url);
    }

    if (!apply) {
      console.info(`[image-migration] mode=dry-run referenced=${referenced.size} recoverable=${referenced.size - missing} missingOrInvalid=${missing}`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const product of await tx.product.findMany({ select: { id: true, images: true } })) {
        const images = normalizeProductImages(product.images);
        const nextImages = images.map((image) => replacements.get(getLegacyImage(image)?.path ?? "") ?? image);
        if (nextImages.some((image, index) => image !== images[index])) {
          await tx.product.update({ where: { id: product.id }, data: { images: nextImages } });
        }
      }
      for (const user of await tx.user.findMany({ select: { id: true, image: true } })) {
        const image = user.image && replacements.get(getLegacyImage(user.image)?.path ?? "");
        if (image) await tx.user.update({ where: { id: user.id }, data: { image } });
      }
      for (const post of await tx.blogPost.findMany({ select: { id: true, featuredImage: true } })) {
        const image = post.featuredImage && replacements.get(getLegacyImage(post.featuredImage)?.path ?? "");
        if (image) await tx.blogPost.update({ where: { id: post.id }, data: { featuredImage: image } });
      }
      for (const testimonial of await tx.testimonial.findMany({ select: { id: true, image: true } })) {
        const image = testimonial.image && replacements.get(getLegacyImage(testimonial.image)?.path ?? "");
        if (image) await tx.testimonial.update({ where: { id: testimonial.id }, data: { image } });
      }
    });

    console.info(`[image-migration] mode=apply migrated=${replacements.size} missingOrInvalid=${missing}`);
  } catch (error) {
    for (const url of uploadedUrls) {
      try {
        const { deleteManagedImagesIfUnreferenced } = await import("../src/server/storage/image-references");
        await deleteManagedImagesIfUnreferenced([url], store);
      } catch {
        console.error("[image-migration] failed to clean up an uploaded object after migration failure");
      }
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected image migration failure";
  console.error(`[image-migration] ${message}`);
  process.exitCode = 1;
});
