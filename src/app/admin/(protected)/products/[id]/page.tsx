import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeProductImages } from "@/lib/utils";
import { ArrowLeft, Package } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, benefits: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Package}
        title="Edit Product"
        description={product.name}
        actions={
          <ButtonLink href="/admin/products" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to products
          </ButtonLink>
        }
      />
      <ProductForm
        productId={product.id}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description,
          howToUse: product.howToUse ?? "",
          shippingInfo: product.shippingInfo ?? "",
          categoryId: product.categoryId ?? "",
          images: normalizeProductImages(product.images),
          status: product.status,
          featured: product.featured,
          sku: product.sku ?? "",
          benefits: product.benefits.map((b) => ({ title: b.title, icon: b.icon ?? undefined })),
          variants: product.variants.map((v) => ({
            id: v.id,
            weightLabel: v.weightLabel,
            weightValue: v.weightValue,
            weightUnit: v.weightUnit,
            sku: v.sku ?? "",
            originalPrice: v.originalPrice,
            offerPrice: v.offerPrice,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
            isDefault: v.isDefault,
          })),
        }}
      />
    </div>
  );
}
