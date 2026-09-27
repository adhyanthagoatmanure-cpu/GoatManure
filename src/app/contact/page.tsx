"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@/lib/validations/checkout";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SITE } from "@/lib/config";

type FormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(contactFormSchema) });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      show("Message sent — we'll get back to you soon!");
      reset();
    } else {
      show("Couldn't send your message. Please try again.", "error");
    }
  }

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Get in Touch</h1>
        <p className="mt-2 text-[var(--color-stone)]">
          Questions about our products or your order? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <ContactInfoCard icon={MapPin} title="Business Address" lines={[SITE.address]} />
          <ContactInfoCard icon={Phone} title="Phone" lines={[SITE.supportPhone, "(Mon - Sat, 9 AM - 6 PM)"]} />
          <ContactInfoCard icon={Mail} title="Email" lines={[SITE.supportEmail, "(We reply within 24 hours)"]} />
          <ContactInfoCard icon={Clock} title="Business Hours" lines={["Mon – Sat: 9:00 AM – 6:00 PM", "Sunday: Closed"]} />

          <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-parchment-deep)]">
            <iframe
              title="Map"
              className="h-full w-full grayscale"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" {...register("name")} error={errors.name?.message} />
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Phone (optional)" {...register("phone")} error={errors.phone?.message} />
            <Input label="Subject" {...register("subject")} error={errors.subject?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Message" rows={5} {...register("message")} error={errors.message?.message} />
          </div>
          <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" isLoading={isSubmitting}>
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}

function ContactInfoCard({ icon: Icon, title, lines }: { icon: typeof MapPin; title: string; lines: string[] }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-canopy)]/10">
        <Icon className="h-4.5 w-4.5 text-[var(--color-canopy)]" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {lines.map((l) => (
          <p key={l} className="text-xs text-[var(--color-stone)]">{l}</p>
        ))}
      </div>
    </div>
  );
}
