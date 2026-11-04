import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const STATIC_PATHS = [
  "",
  "/products",
  "/benefits",
  "/blog",
  "/testimonials",
  "/faq",
  "/contact",
  "/shipping-info",
  "/returns-refunds",
  "/privacy-policy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://goatmanure.com";

  const staticEntries = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.7,
  }));

  try {
    const [products, posts] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticEntries,
      ...products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
