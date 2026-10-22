"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus, Trash2, Upload, X } from "lucide-react";
import { productSchema, type ProductInput } from "@/lib/validations/admin";
import { cn, mergeProductImageUrls, normalizeProductImages } from "@/lib/utils";
import { ICON_BUTTON_DANGER, PANEL } from "@/components/admin/admin-ui";
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
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

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
  const [unavailableImages, setUnavailableImages] = useState<Set<string>>(() => new Set());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function onSubmit(values: ProductInput) {
    setServerError(null);
    setImageUploadError(null);
    let uploadedImages: string[] = [];
    try {
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("files", file));
        let uploadRes: Response;
        let uploadData: { error?: string; message?: string; urls?: unknown };
        try {
          uploadRes = await fetch("/api/admin/products/images", { method: "POST", body: formData });
          uploadData = await uploadRes.json();
        } catch {
          setImageUploadError("Could not upload product images. Existing images are unchanged; please try again.");
          return;
        }
        if (!uploadRes.ok) {
          setImageUploadError(uploadData.message ?? uploadData.error ?? "Could not upload product images");
          return;
        }
        uploadedImages = Array.isArray(uploadData.urls)
          ? uploadData.urls.filter(
              (url: unknown): url is string =>
                typeof url === "string" &&
                /^\/api\/storage\/products\/[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/i.test(url),
            )
          : [];
        if (uploadedImages.length !== imageFiles.length) {
          await releaseUploadedImages(uploadedImages);
          setImageUploadError("The image upload did not complete. Existing product images were not changed; please retry.");
          return;
        }
      }

      const existingImages = imagesText.split("\n").map((s) => s.trim()).filter(Boolean);
      const images = mergeProductImageUrls(existingImages, uploadedImages);
      const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, images }),
      });
      const data = await res.json();
      if (!res.ok) {
        await releaseUploadedImages(uploadedImages);
        setServerError(data.error ?? "Something went wrong");
        return;
      }
      show(productId ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      await releaseUploadedImages(uploadedImages);
      setServerError("Could not save the product. Please try again.");
    }
  }

  async function releaseUploadedImages(urls: string[]) {
    if (urls.length === 0) return;
    try {
      await fetch("/api/admin/products/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
    } catch {
      console.error("Could not request cleanup for uncommitted product images");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7 sm:gap-8">
      {serverError && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-error/30 bg-error-bg px-3.5 py-2.5 text-sm font-medium text-error">{serverError}</p>
      )}

      <Section title="Basic Information">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="Product Name" {...register("name")} error={errors.name?.message} />
            <Input label="URL Slug (optional — auto-generated)" {...register("slug")} error={errors.slug?.message} />
          </div>
          <Input label="Short Description" {...register("shortDescription")} error={errors.shortDescription?.message} />
          <Textarea label="Full Description" {...register("description")} error={errors.description?.message} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select label="Category" {...register("categoryId")} defaultValue="">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input label="SKU (optional)" {...register("sku")} error={errors.sku?.message} />
          </div>
        </div>
      </Section>

      <Section title="Content">
        <div className="flex flex-col gap-5">
          <Textarea label="How to Use" {...register("howToUse")} />
          <Textarea label="Shipping Information" {...register("shippingInfo")} />
        </div>
      </Section>

      <Section title="Images" description="Upload one or multiple product images. The first image is used as the primary image.">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-border-strong bg-sage/40 px-4 py-7 text-center transition-colors hover:border-leaf hover:bg-sage/70 focus-within:border-canopy focus-within:bg-sage/70 focus-within:ring-4 focus-within:ring-canopy/15">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-canopy shadow-[var(--shadow-soft)]">
            <Upload className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-ink">Choose product images</span>
          <span className="text-xs text-stone">JPG, PNG, WEBP, or GIF · up to 5 MB each</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setImageUploadError(null);
              setImageFiles((current) => [...current, ...files]);
              setImagePreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
              e.target.value = "";
            }}
          />
        </label>
        {imageUploadError && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-[var(--radius-sm)] border border-error/40 bg-error-bg px-3.5 py-3 text-sm font-medium text-error"
          >
            {imageUploadError}
          </p>
        )}
        {(defaultImageList.length > 0 || imagePreviews.length > 0) ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {defaultImageList.map((image) => (
              <div key={image} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
                {unavailableImages.has(image) ? (
                  <Package aria-label="Product image unavailable" className="absolute inset-0 m-auto h-8 w-8 text-stone" />
                ) : (
                  <img
                    src={image}
                    alt="Product"
                    className="h-full w-full object-contain p-2"
                    onError={() => setUnavailableImages((current) => new Set(current).add(image))}
                  />
                )}
              </div>
            ))}
            {imagePreviews.map((preview, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
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
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-white transition-colors hover:bg-ink sm:h-8 sm:w-8"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-5">
          <Textarea
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder="Optional existing image paths, one per line"
          />
        </div>
      </Section>

      <Section title="Benefits (shown on the product page)">
        <div className="flex flex-col gap-3">
          {benefitArray.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input aria-label={`Benefit ${i + 1}`} placeholder="e.g. 100% Organic" {...register(`benefits.${i}.title` as const)} />
              <button type="button" aria-label={`Remove benefit ${i + 1}`} className={cn(ICON_BUTTON_DANGER, "sm:h-11 sm:w-11")} onClick={() => benefitArray.remove(i)}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-1 self-start" onClick={() => benefitArray.append({ title: "" })}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add Benefit
          </Button>
        </div>
      </Section>

      <Section title="Weight Variants & Pricing" description="At least one weight/size option is required.">
        <div className="flex flex-col gap-4">
          {variantArray.fields.map((field, i) => (
            <div key={field.id} className="rounded-[var(--radius-md)] border border-border bg-canvas/70 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <Input label="Label" placeholder="1 KG" {...register(`variants.${i}.weightLabel` as const)} />
                <Input label="Weight" type="number" step="any" {...register(`variants.${i}.weightValue` as const, { valueAsNumber: true })} />
                <Input label="Original ₹" type="number" {...register(`variants.${i}.originalPrice` as const, { valueAsNumber: true })} />
                <Input label="Offer ₹" type="number" {...register(`variants.${i}.offerPrice` as const, { valueAsNumber: true })} />
                <Input label="Stock" type="number" {...register(`variants.${i}.stock` as const, { valueAsNumber: true })} />
                <Input label="Low Stock At" type="number" {...register(`variants.${i}.lowStockThreshold` as const, { valueAsNumber: true })} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-ink">
                  <input type="checkbox" className="h-4 w-4 rounded accent-canopy" {...register(`variants.${i}.isDefault` as const)} /> Default variant
                </label>
                <button
                  type="button"
                  onClick={() => variantArray.remove(i)}
                  disabled={variantArray.fields.length <= 1}
                  className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-bg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                </button>
              </div>
            </div>
          ))}
          {errors.variants?.message && <p role="alert" className="text-xs font-medium text-error">{errors.variants.message}</p>}
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
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add Variant
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
          <label className="mt-6 flex min-h-11 items-center gap-2.5 text-sm font-medium text-ink">
            <input type="checkbox" className="h-4 w-4 rounded accent-canopy" {...register("featured")} /> Feature on homepage
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
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
    <section className={cn(PANEL, "p-5 sm:p-6")}>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-stone">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
