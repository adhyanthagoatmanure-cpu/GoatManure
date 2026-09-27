"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { reviewSchema } from "@/lib/validations/checkout";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof reviewSchema>;

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const router = useRouter();
  const { show } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, rating: 5 },
  });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rating }),
    });
    if (res.ok) {
      show("Thanks — your review has been submitted!");
      reset({ productId, authorName: "", comment: "", rating: 5 });
      setRating(5);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      show(data.error ?? "Couldn't submit your review. Please try again.", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 border-t border-[var(--color-border)] pt-8">
      <h4 className="font-display text-lg font-medium">Write a Review</h4>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${i} star`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                i <= (hoverRating || rating)
                  ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                  : "fill-none text-[var(--color-border-strong)]"
              )}
            />
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label="Your name" placeholder="e.g. Priya S." {...register("authorName")} error={errors.authorName?.message} />
      </div>
      <div className="mt-4">
        <Textarea
          label="Your review"
          placeholder="Tell other gardeners about your experience…"
          {...register("comment")}
          error={errors.comment?.message}
        />
      </div>
      <Button type="submit" className="mt-4" isLoading={isSubmitting}>
        Submit Review
      </Button>
    </form>
  );
}
