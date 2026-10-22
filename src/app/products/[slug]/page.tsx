import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sprout } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductCard } from "@/components/product/product-card";
import { getProductBySlug, getRelatedProducts } from "@/server/services/product.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 150),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "ACTIVE") notFound();

  const related = await getRelatedProducts(product.id, product.categoryId, 4);

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-stone)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-canopy)]">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <Link href="/products" className="transition-colors hover:text-[var(--color-canopy)]">Products</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span aria-current="page" className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="min-w-0">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="eyebrow hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 break-words font-display text-3xl font-medium sm:text-5xl">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-3 text-base leading-relaxed text-[var(--color-stone)]">{product.shortDescription}</p>
          )}

          {product.benefits.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {product.benefits.map((b) => (
                <li
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-sage)] px-3 py-1.5 text-sm font-medium text-[var(--color-canopy-dark)]"
                >
                  <Sprout className="h-3.5 w-3.5 text-[var(--color-leaf)]" aria-hidden="true" /> {b.title}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7">
            <ProductPurchasePanel productId={product.id} productName={product.name} variants={product.variants} />
          </div>
        </div>
      </div>

      <ProductTabs
        productId={product.id}
        description={product.description}
        howToUse={product.howToUse}
        shippingInfo={product.shippingInfo}
        reviews={product.reviews}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
      />

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <p className="eyebrow">Keep exploring</p>
          <h2 id="related-heading" className="mt-2 font-display text-3xl font-medium">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
