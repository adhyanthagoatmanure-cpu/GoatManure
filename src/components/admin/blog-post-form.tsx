"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogPostSchema, type BlogPostInput } from "@/lib/validations/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function BlogPostForm({ postId, defaultValues }: { postId?: string; defaultValues?: Partial<BlogPostInput> }) {
  const router = useRouter();
  const { show } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.featuredImage ?? null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { status: "DRAFT", author: "ADHYANTHA Team", ...defaultValues },
  });
  const selectedStatus = useWatch({ control, name: "status" });

  useEffect(() => () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  async function onSubmit(values: BlogPostInput) {
    setServerError(null);
    let featuredImage = values.featuredImage || "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/admin/blog/images", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setServerError(uploadData.error ?? "Could not upload blog image");
        return;
      }
      featuredImage = uploadData.url;
    }
    const res = await fetch(postId ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
      method: postId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, featuredImage: featuredImage || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong");
      return;
    }
    show(postId ? "Article updated" : "Article created");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {serverError && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">{serverError}</p>
      )}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title" {...register("title")} error={errors.title?.message} />
          <Input label="URL Slug (optional)" {...register("slug")} error={errors.slug?.message} />
        </div>
        <div className="mt-4">
          <Textarea label="Excerpt (short summary)" {...register("excerpt")} error={errors.excerpt?.message} />
        </div>
        <div className="mt-4">
          <Textarea label="Content" className="min-h-[260px]" {...register("content")} error={errors.content?.message} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Category" placeholder="e.g. Guides" {...register("category")} />
          <Input label="Author" {...register("author")} />
          <Select label="Status" {...register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-[var(--color-ink)]">Featured Image</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-parchment-deep)]/30 px-4 py-3 text-sm hover:bg-[var(--color-parchment-deep)]/60">
              <Upload className="h-4 w-4 text-[var(--color-canopy)]" />
              <span>{imageFile ? "Choose another image" : "Upload image"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                  event.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-[var(--color-stone)]">JPG, PNG, WEBP, or GIF · up to 5 MB</span>
          </div>
          {imagePreview && (
            <div className="relative mt-3 h-40 w-full max-w-xs overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white">
              <img src={imagePreview} alt="Featured blog preview" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove featured image"
                onClick={() => {
                  if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(null);
                  setImagePreview(null);
                  setValue("featuredImage", "");
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)]/75 text-white hover:bg-[var(--color-ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Input className="mt-3" label="Or use an existing image URL/path (optional)" placeholder="/images/blog/example.jpg" error={errors.featuredImage?.message} {...register("featuredImage")} />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h3 className="font-display text-lg font-medium">SEO</h3>
        <div className="mt-4 grid gap-4">
          <Input label="SEO Title (optional)" {...register("seoTitle")} />
          <Textarea label="SEO Description (optional)" {...register("seoDescription")} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg" isLoading={isSubmitting}>{postId ? "Save Changes" : selectedStatus === "PUBLISHED" ? "Publish Article" : "Save Draft"}</Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
