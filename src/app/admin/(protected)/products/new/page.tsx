import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-medium">Add Product</h1>
      <ProductForm />
    </div>
  );
}
