"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function ProfileImageUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function upload(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      show("Choose a JPG, PNG, WEBP, or GIF image smaller than 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/account/profile/image", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        show(data?.message ?? data?.error ?? "Image upload failed.");
        return;
      }
      router.refresh();
      show("Profile photo uploaded.");
    } catch {
      show("Image upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-2 inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-canopy px-3 text-xs font-semibold text-canopy transition-colors hover:bg-sage disabled:cursor-wait disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Change profile photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        aria-label="Choose profile photo"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
    </>
  );
}
