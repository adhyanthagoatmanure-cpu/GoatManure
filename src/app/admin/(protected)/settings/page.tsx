"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Camera, ChevronRight, CircleUserRound, ExternalLink, FileText, Settings2,
  LifeBuoy, Mail, Package, Phone, Save, Shield, ShoppingCart, Trash2, UserRound, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AdminPageHeader, PANEL } from "@/components/admin/admin-ui";

type Profile = { name: string | null; email: string; phone: string | null; designation: string | null; bio: string | null; image: string | null };

const sections = [
  { label: "Personal Information", icon: UserRound },
  { label: "Contact Information", icon: Phone },
  { label: "Social Links", icon: ExternalLink },
  { label: "About Me", icon: FileText },
];

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", designation: "", bio: "" });
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/account/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load profile");
        return response.json();
      })
      .then((data: Profile) => {
        setProfile(data);
        setImage(data.image);
        setDraft({ name: data.name ?? "", phone: data.phone ?? "", designation: data.designation ?? "Administrator", bio: data.bio ?? "" });
      })
      .catch(() => show("Unable to load your profile. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, [show]);

  function cancelChanges() {
    if (!profile) return;
    setDraft({ name: profile.name ?? "", phone: profile.phone ?? "", designation: profile.designation ?? "Administrator", bio: profile.bio ?? "" });
    setImage(profile.image);
    setPreview(null);
  }

  async function chooseImage(file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      show("Choose a JPG or PNG image smaller than 2 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/account/profile/image", { method: "POST", body: formData });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) { show(data.error ?? "Image upload failed."); return; }
    setImage(data.image);
    setPreview(null);
    router.refresh();
    show("Profile photo uploaded.");
  }

  async function saveChanges() {
    setSaving(true);
    const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, image }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { show(data.error ?? "Unable to save changes."); return; }
    setProfile(data);
    setDraft({ name: data.name ?? "", phone: data.phone ?? "", designation: data.designation ?? "", bio: data.bio ?? "" });
    show("Profile settings saved successfully.");
  }

  const avatar = preview ?? image ?? "/images/brand/logo-mark-192.png";
  if (loading) return <div className="flex min-h-[420px] items-center justify-center text-sm text-stone">Loading profile settings...</div>;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <AdminPageHeader
        icon={Settings2}
        eyebrow="Admin preferences"
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <nav aria-label="Settings sections" className={cn(PANEL, "flex gap-2 overflow-x-auto p-2")}>
        <Tab active icon={CircleUserRound} label="Profile Settings" />
        <Tab icon={Settings2} label="Site Settings" href="/admin/settings?tab=site" />
        <Tab icon={Bell} label="Notification Settings" href="/admin/settings?tab=notifications" />
        <Tab icon={Shield} label="Security" href="/account/change-password" />
      </nav>

      <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)_280px]">
        <aside className={cn(PANEL, "p-5")}>
          <div className="text-center">
            <div className="relative mx-auto h-24 w-24">
              {/* Plain <img>: the preview can be a blob: URL from the file picker, which next/image cannot optimise. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="Administrator profile" className="h-24 w-24 rounded-full object-cover ring-4 ring-sage" />
              <span aria-hidden className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-canopy text-white"><Camera className="h-4 w-4" /></span>
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold text-ink">{draft.name || "Administrator"}</h2>
            <p className="text-xs text-stone">{draft.designation || "Administrator"}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-canopy px-3 text-xs font-semibold text-canopy transition-colors hover:bg-sage sm:min-h-9"
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" aria-label="Choose profile photo" onChange={(event) => event.target.files?.[0] && chooseImage(event.target.files[0])} />
          </div>
          <div className="mt-6 space-y-1 border-t border-border pt-4">
            {sections.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                type="button"
                aria-current={index === 0 ? "true" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm",
                  index === 0 ? "border-l-2 border-canopy bg-sage font-semibold text-canopy" : "text-stone transition-colors hover:bg-sage/60"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />{label}
              </button>
            ))}
          </div>
        </aside>

        <section className={cn(PANEL, "p-5 sm:p-7")}>
          <div className="border-b border-border pb-4">
            <h2 className="font-display text-xl font-semibold text-ink">Personal Information</h2>
            <p className="mt-1 text-sm text-stone">Update your personal details here.</p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Full Name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input label="Email Address *" value={profile?.email ?? ""} disabled />
            <Input label="Phone Number *" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Input label="Designation *" value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} />
          </div>
          <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-sage/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Profile Picture</h3>
                <p className="mt-1 text-xs text-stone">Upload a new profile picture · JPG, PNG (Max 2MB)</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>
                {image && (
                  <button
                    type="button"
                    onClick={() => { setImage(null); setPreview(null); }}
                    className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-error transition-colors hover:bg-error-bg sm:min-h-9"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5">
            <Textarea
              id="bio"
              label="About Me"
              value={draft.bio}
              maxLength={500}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              className="min-h-28"
              placeholder="Tell us a little about yourself..."
            />
            <div className="mt-1 text-right text-xs text-stone">{draft.bio.length}/500</div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={cancelChanges}><X className="h-4 w-4" aria-hidden />Cancel</Button>
            <Button type="button" isLoading={saving} onClick={saveChanges}><Save className="h-4 w-4" aria-hidden />Save Changes</Button>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="relative isolate overflow-hidden rounded-[var(--radius-lg)] bg-canopy-dark p-5 text-white shadow-[var(--shadow-soft)]">
            <Image src="/images/05_seedling_fertile_soil.jpg" alt="" fill sizes="280px" className="object-cover opacity-25" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-deep">Grow with nature</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">Better Soil<br />Better Tomorrow</h3>
            </div>
          </div>
          <div className={cn(PANEL, "p-5")}>
            <h3 className="font-display text-lg font-semibold text-ink">Quick Links</h3>
            <div className="mt-3 space-y-1">
              {[
                { href: "/products", label: "View Products", icon: Package },
                { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart },
                { href: "/admin/customers", label: "Customer List", icon: Users },
                { href: "/admin", label: "Sales Report", icon: FileText },
                { href: "/", label: "Site Preview", icon: ExternalLink },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={label} href={href} className="flex min-h-11 items-center justify-between rounded-[var(--radius-sm)] px-2 py-2 text-sm text-stone transition-colors hover:bg-sage hover:text-canopy">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden />{label}</span>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-sage/50 p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Need Help?</h3>
            <p className="mt-1 text-sm text-stone">Our support team is here for you. Feel free to contact us.</p>
            <div className="mt-4 space-y-2 text-xs text-stone">
              <a href={`tel:${SITE.supportPhone.replace(/\D/g, "")}`} className="flex min-h-9 items-center gap-2"><Phone className="h-4 w-4 text-leaf" aria-hidden />{SITE.supportPhone}</a>
              <a href={`mailto:${SITE.supportEmail}`} className="flex min-h-9 items-center gap-2"><Mail className="h-4 w-4 text-leaf" aria-hidden />{SITE.supportEmail}</a>
              <span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-leaf" aria-hidden />Mon–Sat, 9 AM–6 PM</span>
            </div>
          </div>
        </aside>
      </div>
      <div data-on-dark className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-canopy-dark px-6 py-5 text-white shadow-[var(--shadow-soft)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-deep">Natural care for every garden</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-white">Organic Farming for a Greener Future</h2>
        </div>
        <Link href="/products" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-sage-deep px-4 text-sm font-semibold text-canopy-dark transition-colors hover:bg-white">
          Adhyantha Goat Manure <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function Tab({ label, icon: Icon, href, active }: { label: string; icon: typeof Settings2; href?: string; active?: boolean }) {
  const className = cn(
    "flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold transition-colors",
    active ? "bg-canopy text-white" : "text-stone hover:bg-sage hover:text-canopy"
  );
  return href ? (
    <Link href={href} className={className}><Icon className="h-4 w-4" aria-hidden />{label}</Link>
  ) : (
    <button type="button" aria-current="page" className={className}><Icon className="h-4 w-4" aria-hidden />{label}</button>
  );
}
