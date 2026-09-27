"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { productSchema, type ProductInput } from "@/lib/validations/admin";
import { normalizeProductImages } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

interface Category {
  id: string;
  name: string;
}

export function ProductForm({
  productId,
  defaultValues,
}: {
  productId?: string;
  defaultValues?: Partial<ProductInput>;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "ACTIVE",
      featured: false,
      images: [],
      benefits: [],
      variants: [{ weightLabel: "1 KG", weightValue: 1, weightUnit: "KG", originalPrice: 0, offerPrice: 0, stock: 0, lowStockThreshold: 10, isDefault: true }],
      ...defaultValues,
    },
  });

  const variantArray = useFieldArray({ control, name: "variants" });
  const benefitArray = useFieldArray({ control, name: "benefits" });
  const defaultImageList = normalizeProductImages(defaultValues?.images);
  const [imagesText, setImagesText] = useState(defaultImageList.join("\n"));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function onSubmit(values: ProductInput) {
    setServerError(null);
    let uploadedImages: string[] = [];
    if (imageFiles.length > 0) {
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("files", file));
      const uploadRes = await fetch("/api/admin/products/images", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setServerError(uploadData.error ?? "Could not upload product images");
        return;
      }
      uploadedImages = uploadData.urls ?? [];
    }

    const images = [...imagesText.split("\n").map((s) => s.trim()).filter(Boolean), ...uploadedImages];
    const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
      method: productId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, images }),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong");
      return;
    }
    show(productId ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">{serverError}</p>
      )}

      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product Name" {...register("name")} error={errors.name?.message} />
          <Input label="URL Slug (optional — auto-generated)" {...register("slug")} error={errors.slug?.message} />
        </div>
        <Input label="Short Description" className="mt-4" {...register("shortDescription")} error={errors.shortDescription?.message} />
        <div className="mt-4">
          <Textarea label="Full Description" {...register("description")} error={errors.description?.message} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select label="Category" {...register("categoryId")} defaultValue="">
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="SKU (optional)" {...register("sku")} error={errors.sku?.message} />
        </div>
      </Section>

      <Section title="Content">
        <div className="grid gap-4">
          <Textarea label="How to Use" {...register("howToUse")} />
          <Textarea label="Shipping Information" {...register("shippingInfo")} />
        </div>
      </Section>

      <Section title="Images" description="Upload one or multiple product images. The first image is used as the primary image.">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-parchment-deep)]/30 px-4 py-6 text-center hover:bg-[var(--color-parchment-deep)]/60">
          <Upload className="h-5 w-5 text-[var(--color-canopy)]" />
          <span className="text-sm font-medium">Choose product images</span>
          <span className="text-xs text-[var(--color-stone)]">JPG, PNG, WEBP, or GIF · up to 5 MB each</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setImageFiles((current) => [...current, ...files]);
              setImagePreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
              e.target.value = "";
            }}
          />
        </label>
        {(defaultImageList.length > 0 || imagePreviews.length > 0) ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {defaultImageList.map((image) => (
              <div key={image} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white">
                <img src={image} alt="Product" className="h-full w-full object-contain p-2" />
              </div>
            ))}
            {imagePreviews.map((preview, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white">
                <img src={preview} alt={`Selected product image ${index + 1}`} className="h-full w-full object-contain p-2" />
                <button
                  type="button"
                  aria-label={`Remove selected image ${index + 1}`}
                  onClick={() => {
                    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                    setImagePreviews((current) => {
                      URL.revokeObjectURL(current[index]);
                      return current.filter((_, previewIndex) => previewIndex !== index);
                    });
                  }}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)]/75 text-white hover:bg-[var(--color-ink)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <Textarea
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          placeholder="Optional existing image paths, one per line"
        />
      </Section>

      <Section title="Benefits (shown on the product page)">
        <div className="flex flex-col gap-2">
          {benefitArray.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input placeholder="e.g. 100% Organic" {...register(`benefits.${i}.title` as const)} />
              <Button type="button" variant="ghost" size="sm" onClick={() => benefitArray.remove(i)}>
                <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-1 self-start" onClick={() => benefitArray.append({ title: "" })}>
            <Plus className="h-3.5 w-3.5" /> Add Benefit
          </Button>
        </div>
      </Section>

      <Section title="Weight Variants & Pricing" description="At least one weight/size option is required.">
        <div className="flex flex-col gap-4">
          {variantArray.fields.map((field, i) => (
            <div key={field.id} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-4">
              <div className="grid gap-3 sm:grid-cols-6">
                <Input label="Label" placeholder="1 KG" {...register(`variants.${i}.weightLabel` as const)} />
                <Input label="Weight" type="number" step="any" {...register(`variants.${i}.weightValue` as const, { valueAsNumber: true })} />
                <Input label="Original ₹" type="number" {...register(`variants.${i}.originalPrice` as const, { valueAsNumber: true })} />
                <Input label="Offer ₹" type="number" {...register(`variants.${i}.offerPrice` as const, { valueAsNumber: true })} />
                <Input label="Stock" type="number" {...register(`variants.${i}.stock` as const, { valueAsNumber: true })} />
                <Input label="Low Stock At" type="number" {...register(`variants.${i}.lowStockThreshold` as const, { valueAsNumber: true })} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`variants.${i}.isDefault` as const)} /> Default variant
                </label>
                <button
                  type="button"
                  onClick={() => variantArray.remove(i)}
                  disabled={variantArray.fields.length <= 1}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-error)] disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
          {errors.variants?.message && <p className="text-xs text-[var(--color-error)]">{errors.variants.message}</p>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              variantArray.append({
                weightLabel: "",
                weightValue: 1,
                weightUnit: "KG",
                originalPrice: 0,
                offerPrice: 0,
                stock: 0,
                lowStockThreshold: 10,
                isDefault: false,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add Variant
          </Button>
        </div>
      </Section>

      <Section title="Visibility">
        <div className="flex flex-wrap items-center gap-6">
          <Select label="Status" {...register("status")} className="w-40">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </Select>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("featured")} /> Feature on homepage
          </label>
        </div>
      </Section>

      <div className="flex gap-3">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {productId ? "Save Changes" : "Create Product"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <h3 className="font-display text-lg font-medium">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-[var(--color-stone)]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
