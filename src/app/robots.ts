import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://goatmanure.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account/", "/api/", "/checkout/", "/cart/", "/login", "/signup"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
