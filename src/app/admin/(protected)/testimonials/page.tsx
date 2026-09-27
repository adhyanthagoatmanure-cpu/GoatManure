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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) { show("Testimonial deleted"); load(); }
  }

  if (items === null) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ebf6ee] text-[#1d5d47] shadow-sm ring-1 ring-[#dfeee3]">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#173b2d] md:text-4xl">Testimonials</h1>
            <p className="mt-1 text-sm text-[#5a766d]">Real stories. Real farmers. Real results.</p>
          </div>
        </div>

        {!showForm && (
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f5d46] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#104d3d]"
          >
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        )}
      </div>

      {showForm && (
        <TestimonialForm
          initial={editing ?? undefined}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <article key={t.id} className="rounded-[26px] border border-[#e7e3d9] bg-[#fffdf9] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef8f0] text-[#1a5f47]">
                <Quote className="h-5 w-5 fill-current" />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {t.isDemo && <Badge tone="warning">Demo</Badge>}
                <Badge tone={t.isPublished ? "success" : "neutral"}>{t.isPublished ? "Published" : "Hidden"}</Badge>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1 text-[#f1b66a]">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${index < (t.rating ?? 0) ? "fill-current" : "text-[#dfe6e1] fill-none"}`} />
              ))}
            </div>

            <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#2a4037]">“{t.review}”</p>

            <div className="mt-4 border-t border-[#ece7dc] pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#183b2d]">{t.customerName}</p>
                  {t.location && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#688075]">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{t.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[#1f5e47]">
                  <button onClick={() => { setEditing(t); setShowForm(true); }} className="rounded-lg border border-[#dfe9e2] bg-[#f5faf6] p-2 hover:bg-[#ebf6ef]" aria-label="Edit testimonial">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="rounded-lg border border-[#f2d9d9] bg-[#fff3f3] p-2 text-[#b64747] hover:bg-[#ffeaea]" aria-label="Delete testimonial">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="rounded-[26px] border border-dashed border-[#d7dfd8] bg-[#fbfaf7] p-8 text-center text-[#587164]">
          <Sparkles className="mx-auto h-8 w-8 text-[#0f5d46]" />
          <p className="mt-3 text-base font-medium text-[#173b2d]">No testimonials yet.</p>
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
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[28px] border border-[#e6e0d3] bg-[#fffdf9] p-5 shadow-sm sm:p-6">
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
      <div className="mt-4 flex flex-wrap gap-6 text-sm text-[#284c41]">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("isDemo")} className="h-4 w-4 rounded border-[#bfd2c7] text-[#0f5d46]" />
          Mark as demo/placeholder
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("isPublished")} className="h-4 w-4 rounded border-[#bfd2c7] text-[#0f5d46]" />
          Published (visible on site)
        </label>
      </div>
      <div className="mt-5 flex gap-3">
        <Button type="submit" isLoading={isSubmitting} className="bg-[#0f5d46] text-white hover:bg-[#104d3d]">
          {initial ? "Save Changes" : "Add Testimonial"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
