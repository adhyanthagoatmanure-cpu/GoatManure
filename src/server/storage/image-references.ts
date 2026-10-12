import { normalizeProductImages } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  createR2ImageStore,
  cleanupUnusedImages,
  deleteImagesIfUnreferenced,
  type ImageObjectStore,
} from "@/server/storage/image-storage";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

export async function getAllImageReferences(): Promise<string[]> {
  const [products, users, blogPosts, testimonials, paymentIntents] = await Promise.all([
    prisma.product.findMany({ select: { images: true } }),
    prisma.user.findMany({ select: { image: true } }),
    prisma.blogPost.findMany({ select: { featuredImage: true } }),
    prisma.testimonial.findMany({ select: { image: true } }),
    prisma.paymentIntent.findMany({ select: { items: true } }),
  ]);

  return [
    ...products.flatMap((product) => normalizeProductImages(product.images)),
    ...users.flatMap((user) => (user.image ? [user.image] : [])),
    ...blogPosts.flatMap((post) => (post.featuredImage ? [post.featuredImage] : [])),
    ...testimonials.flatMap((testimonial) => (testimonial.image ? [testimonial.image] : [])),
    ...paymentIntents.flatMap((intent) => collectStrings(intent.items)),
  ];
}

export async function cleanupManagedImages(dryRun: boolean) {
  const references = await getAllImageReferences();
  return cleanupUnusedImages(createR2ImageStore(), references, dryRun);
}

export async function deleteManagedImagesIfUnreferenced(
  urls: string[],
  store: ImageObjectStore = createR2ImageStore(),
) {
  const references = await getAllImageReferences();
  return deleteImagesIfUnreferenced(store, urls, references);
}
