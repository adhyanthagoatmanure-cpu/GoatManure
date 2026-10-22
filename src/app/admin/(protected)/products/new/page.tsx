import { ArrowLeft, Package } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Package}
        title="Add Product"
        description="Create a product with its images, weight variants and pricing."
        actions={
          <ButtonLink href="/admin/products" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to products
          </ButtonLink>
        }
      />
      <ProductForm />
    </div>
  );
}
