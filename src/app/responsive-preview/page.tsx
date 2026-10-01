import type { ProductVariant } from "@prisma/client";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import type { ProductListItem } from "@/server/services/product.service";

const variants: ProductVariant[] = [
  {
    id: "mobile-test-variant",
    productId: "mobile-test",
    weightLabel: "1 KG",
    weightValue: 1,
    weightUnit: "KG",
    sku: null,
    originalPrice: 899,
    offerPrice: 699,
    stock: 12,
    lowStockThreshold: 5,
    isDefault: true,
    sortOrder: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

const cardProduct: ProductListItem = {
  id: "mobile-test",
  name: "Organic Goat Manure Fertilizer",
  slug: "organic-goat-manure-fertilizer",
  shortDescription: null,
  images: [],
  avgRating: 4.8,
  reviewCount: 24,
  featured: true,
  category: { name: "Organic Fertilizer", slug: "organic-fertilizer" },
  variants: variants.map(({ id, weightLabel, weightValue, originalPrice, offerPrice, stock, isDefault }) => ({
    id,
    weightLabel,
    weightValue,
    originalPrice,
    offerPrice,
    stock,
    isDefault,
  })),
};

export default function ResponsivePreviewPage() {
  return (
    <div className="container-page space-y-10 py-8">
      <section>
        <h1 className="mb-4 font-display text-2xl">Product card preview</h1>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <ProductCard product={cardProduct} />
          <ProductCard product={{ ...cardProduct, id: "mobile-test-2", name: "A shorter product" }} />
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-2xl">Product detail purchase panel</h2>
        <ProductPurchasePanel
          productId="mobile-test"
          productName="Organic Goat Manure Fertilizer"
          variants={variants}
        />
      </section>
    </div>
  );
}
