"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import type { z } from "zod";
import {
  ArrowRight, Building2, CalendarDays, CheckCircle2, Leaf, Mail, MapPin, MessageCircle, Phone, Send,
} from "lucide-react";
import { contactFormSchema } from "@/lib/validations/checkout";
import { SITE } from "@/lib/config";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AdminPageHeader, PANEL, PANEL_GLASS } from "@/components/admin/admin-ui";
import { useToast } from "@/components/providers/toast-provider";

type ContactValues = z.infer<typeof contactFormSchema>;
type Message = ContactValues & { id: string; isRead: boolean; createdAt: string };

const address = SITE.address;
const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`;

export default function AdminContactPage() {
  const { show } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactFormSchema),
  });

  useEffect(() => {
    fetch("/api/admin/contact")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load messages");
        const data = await response.json();
        setMessages(data.messages ?? []);
      })
      .catch(() => show("Contact messages could not be loaded.", "error"))
      .finally(() => setLoadingMessages(false));
  }, [show]);

  async function submit(values: ContactValues) {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      show("Couldn't send your message. Please try again.", "error");
      return;
    }
    show("Message sent successfully.");
    reset();
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <AdminPageHeader
        icon={Mail}
        eyebrow="Admin communication"
        title="Contact Us"
        description="We are here to help! Get in touch with us for any queries, support or business inquiries."
        actions={
          <div suppressHydrationWarning className={cn(PANEL_GLASS, "px-4 py-2 text-right text-xs text-stone")}>
            <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-leaf" aria-hidden />
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ContactCard icon={Phone} title="Phone" value={SITE.supportPhone} note="Mon - Sat, 9 AM - 6 PM" />
        <ContactCard icon={Mail} title="Email" value={SITE.supportEmail} note="We reply within 24 hours" />
        <ContactCard icon={MapPin} title="Our Address" value={address} note="Coimbatore, Tamil Nadu" />
        <ContactCard icon={MessageCircle} title="WhatsApp" value={SITE.whatsappPhone} note="Chat with us →" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={cn(PANEL, "p-5")}>
            <SectionHeading icon={Leaf} title="Send Us a Message" subtitle="Fill in the form below and we will get back to you shortly." />
            <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-3">
              <Input label="Full Name *" {...register("name")} error={errors.name?.message} />
              <Input label="Email Address *" type="email" {...register("email")} error={errors.email?.message} />
              <Input label="Phone Number" {...register("phone")} error={errors.phone?.message} />
              <Select label="Select Subject" error={errors.subject?.message} {...register("subject")}>
                <option value="">Choose a subject</option>
                <option>Product enquiry</option>
                <option>Order support</option>
                <option>Business enquiry</option>
                <option>Other</option>
              </Select>
              <Textarea label="Your Message *" rows={5} {...register("message")} error={errors.message?.message} />
              <Button type="submit" className="w-full" isLoading={isSubmitting}><Send className="h-4 w-4" aria-hidden /> Send Message</Button>
            </form>
          </section>

          <section className={cn(PANEL, "p-5")}>
            <SectionHeading icon={MapPin} title="Our Location" subtitle="Visit us at our farm and processing unit." />
            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-border bg-sage">
              <iframe title="ADHYANTHA location" className="h-full w-full grayscale-[0.2]" loading="lazy" src={mapUrl} />
            </div>
            <div className="mt-4 flex items-start justify-between gap-3 rounded-[var(--radius-md)] bg-sage/60 p-3">
              <div className="flex gap-2">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-hidden />
                <div>
                  <h3 className="text-sm font-semibold text-ink">Factory / Processing Unit</h3>
                  <p className="mt-1 text-xs text-stone">{address}</p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Coimbatore%2CTamil+Nadu%2CIndia"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-sm)] bg-canopy px-3 text-xs font-semibold text-white transition-colors hover:bg-canopy-dark sm:min-h-9"
              >
                Get Directions
              </a>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="relative isolate min-h-[180px] overflow-hidden rounded-[var(--radius-lg)] bg-canopy-dark p-5 text-white shadow-[var(--shadow-soft)]">
            <Image src="/images/08_adhyantha_product_bag.jpg" alt="ADHYANTHA organic goat manure" fill sizes="300px" className="object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-canopy-dark via-canopy-dark/70 to-transparent" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-sage-deep">ADHYANTHA</p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-white">Grow<br />Green<br />Together</h2>
            </div>
          </div>
          <section className={cn(PANEL, "p-5")}>
            <SectionHeading icon={Leaf} title="Why Choose Us?" />
            <ul className="mt-4 space-y-3 text-sm text-stone">
              {["100% Natural & Organic", "Improves Soil Fertility", "Increases Crop Yield", "Eco Friendly", "Sustainable Farming"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-leaf" aria-hidden />{item}</li>
              ))}
            </ul>
          </section>
          <section className={cn(PANEL, "p-5")}>
            <SectionHeading icon={MessageCircle} title="Follow Us" subtitle="Stay connected for latest updates." />
            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/${SITE.whatsappPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-canopy transition-colors hover:bg-sage-deep sm:h-9 sm:w-9"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </section>
          <div data-on-dark className="rounded-[var(--radius-lg)] bg-canopy-dark p-5 text-white shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.2em] text-sage-deep">Natural farming</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">Better Soil<br />Better Tomorrow</h2>
            <Link href="/products" className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-sage-deep underline-offset-4 hover:text-white hover:underline">
              Explore Products <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>

      <section className={cn(PANEL, "p-5")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Recent Contact Messages</h2>
            <p className="text-xs text-stone">Messages received through the customer contact form.</p>
          </div>
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-canopy">{messages.length} total</span>
        </div>
        {loadingMessages ? (
          <p className="py-6 text-sm text-stone">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-sm text-stone">No contact messages yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {messages.slice(0, 6).map((message) => (
              <div key={message.id} className="rounded-[var(--radius-md)] border border-border bg-white p-4">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{message.name}</p>
                    <p className="break-words text-xs text-stone">{message.email} · {message.subject}</p>
                  </div>
                  <span className="shrink-0 text-xs text-stone">{formatDateTime(message.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-stone">{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContactCard({ icon: Icon, title, value, note }: { icon: typeof Phone; title: string; value: string; note: string }) {
  return (
    <div className={cn(PANEL_GLASS, "flex min-h-[108px] gap-3 p-4")}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-canopy"><Icon className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 break-words text-sm text-stone">{value}</p>
        <p className="mt-1 text-xs text-stone">{note}</p>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: typeof Leaf; title: string; subtitle?: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-hidden />
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-stone">{subtitle}</p>}
      </div>
    </div>
  );
}
