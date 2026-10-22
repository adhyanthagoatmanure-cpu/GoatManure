"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Quote, Star, MapPin, Sparkles } from "lucide-react";
import { testimonialSchema, type TestimonialInput } from "@/lib/validations/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";
import { AdminPageHeader, ICON_BUTTON, ICON_BUTTON_DANGER, PANEL } from "@/components/admin/admin-ui";

interface Testimonial extends TestimonialInput {
  id: string;
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const { show } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/testimonials");
    const data = await res.json();
    setItems(data.testimonials ?? []);
  }, []);

  useEffect(() => {
    // Data is fetched from the admin API during mount; this is the intended client-side hydrate pattern.
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) { show("Testimonial deleted"); load(); }
  }

  if (items === null) return <PageSpinner />;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader
        icon={Star}
        title="Testimonials"
        description="Customer stories shown on the storefront. Mark placeholders as demo."
        actions={
          !showForm && (
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Testimonial
            </Button>
          )
        }
      />

      {showForm && (
        <TestimonialForm
          initial={editing ?? undefined}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <article key={t.id} className={cn(PANEL, "flex flex-col p-5")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-sage text-canopy">
                <Quote className="h-5 w-5 fill-current" aria-hidden />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {t.isDemo && <Badge tone="warning">Demo</Badge>}
                <Badge tone={t.isPublished ? "success" : "neutral"}>{t.isPublished ? "Published" : "Hidden"}</Badge>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-gold-dark" role="img" aria-label={`Rating: ${t.rating ?? 0} out of 5`}>
              {[...Array(5)].map((_, index) => (
                <Star key={index} aria-hidden className={cn("h-4 w-4", index < (t.rating ?? 0) ? "fill-current" : "fill-none text-border-strong")} />
              ))}
            </div>

            <p className="mt-4 line-clamp-4 text-sm leading-6 text-ink">“{t.review}”</p>

            <div className="mt-auto pt-4">
              <div className="flex items-start justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-base font-semibold text-ink">{t.customerName}</p>
                  {t.location && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-stone">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      <span>{t.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setEditing(t); setShowForm(true); }} className={ICON_BUTTON} aria-label={`Edit testimonial from ${t.customerName}`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => handleDelete(t.id)} className={ICON_BUTTON_DANGER} aria-label={`Delete testimonial from ${t.customerName}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-white/70 p-8 text-center text-stone">
          <Sparkles className="mx-auto h-8 w-8 text-leaf" aria-hidden />
          <p className="mt-3 text-base font-medium text-ink">No testimonials yet.</p>
          <p className="mt-1 text-sm">Add a farmer story to showcase your impact.</p>
        </div>
      )}
    </div>
  );
}

function TestimonialForm({ initial, onDone, onCancel }: { initial?: Testimonial; onDone: () => void; onCancel: () => void }) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: initial ?? { rating: 5, isDemo: true, isPublished: true },
  });

  async function onSubmit(values: TestimonialInput) {
    const res = await fetch(initial ? `/api/admin/testimonials/${initial.id}` : "/api/admin/testimonials", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      show(initial ? "Testimonial updated" : "Testimonial added");
      onDone();
    } else {
      show("Something went wrong", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn(PANEL, "p-5 sm:p-6")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Customer Name" {...register("customerName")} error={errors.customerName?.message} />
        <Input label="Location (optional)" {...register("location")} />
        <Select label="Rating" {...register("rating", { valueAsNumber: true })}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
        </Select>
      </div>
      <div className="mt-4">
        <Textarea label="Review Text" {...register("review")} error={errors.review?.message} />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink">
        <label className="flex min-h-11 items-center gap-2.5">
          <input type="checkbox" {...register("isDemo")} className="h-5 w-5 accent-canopy" />
          Mark as demo/placeholder
        </label>
        <label className="flex min-h-11 items-center gap-2.5">
          <input type="checkbox" {...register("isPublished")} className="h-5 w-5 accent-canopy" />
          Published (visible on site)
        </label>
      </div>
      <div className="mt-5 flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {initial ? "Save Changes" : "Add Testimonial"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
