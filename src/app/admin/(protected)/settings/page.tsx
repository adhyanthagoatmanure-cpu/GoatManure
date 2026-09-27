"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Camera, ChevronRight, CircleUserRound, ExternalLink, FileText, Settings2,
  LifeBuoy, Mail, Package, Phone, Save, Shield, ShoppingCart, Trash2, UserRound, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";
import { SITE } from "@/lib/config";

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
  if (loading) return <div className="flex min-h-[420px] items-center justify-center text-sm text-[#718177]">Loading profile settings...</div>;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>        <div className="flex items-center gap-2 text-[#4f9c42]"><Settings2 className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Admin preferences</span></div><h1 className="mt-1 font-display text-3xl font-semibold text-[#173d2b]">Settings</h1><p className="mt-1 text-sm text-[#718177]">Manage your account settings and preferences.</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e0e9df] bg-white p-2">
        <Tab active icon={CircleUserRound} label="Profile Settings" />
        <Tab icon={Settings2} label="Site Settings" href="/admin/settings?tab=site" />
        <Tab icon={Bell} label="Notification Settings" href="/admin/settings?tab=notifications" />
        <Tab icon={Shield} label="Security" href="/account/change-password" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl border border-[#e0e9df] bg-white p-5">
          <div className="text-center"><div className="relative mx-auto h-24 w-24"><img src={avatar} alt="Administrator profile" className="h-24 w-24 rounded-full object-cover ring-4 ring-[#eff8eb]" /><span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#4f9c42] text-white"><Camera className="h-4 w-4" /></span></div><h2 className="mt-3 font-display text-lg font-semibold text-[#173d2b]">{draft.name || "Administrator"}</h2><p className="text-xs text-[#718177]">{draft.designation || "Administrator"}</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-3 rounded-lg border border-[#4f9c42] px-3 py-2 text-xs font-semibold text-[#4f9c42] hover:bg-[#f1faed]">{uploading ? "Uploading..." : "Change Photo"}</button><input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => event.target.files?.[0] && chooseImage(event.target.files[0])} /></div>
          <div className="mt-6 space-y-1 border-t border-[#edf1ed] pt-4">{sections.map(({ label, icon: Icon }, index) => <button key={label} type="button" className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${index === 0 ? "border-l-2 border-[#4f9c42] bg-[#eff8eb] font-semibold text-[#4f9c42]" : "text-[#52665b] hover:bg-[#f5f9f4]"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
        </aside>

        <section className="rounded-2xl border border-[#e0e9df] bg-white p-5 sm:p-7">
          <div className="border-b border-[#edf1ed] pb-4"><h2 className="font-display text-xl font-semibold text-[#173d2b]">Personal Information</h2><p className="mt-1 text-sm text-[#718177]">Update your personal details here.</p></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Full Name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input label="Email Address *" value={profile?.email ?? ""} disabled />
            <Input label="Phone Number *" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Input label="Designation *" value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} />
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-[#cddfca] bg-[#fbfdfb] p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-[#244c38]">Profile Picture</h3><p className="mt-1 text-xs text-[#718177]">Upload a new profile picture · JPG, PNG (Max 2MB)</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>{image && <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="inline-flex items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#b84f4f] hover:bg-[#fff3f1]"><Trash2 className="h-3.5 w-3.5" />Remove</button>}</div></div></div>
          <div className="mt-5"><label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-[#2c4738]">About Me</label><textarea id="bio" value={draft.bio} maxLength={500} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="min-h-28 w-full resize-y rounded-lg border border-[#dce6da] p-3 text-sm outline-none focus:border-[#4f9c42] focus:ring-2 focus:ring-[#4f9c42]/20" placeholder="Tell us a little about yourself..." /><div className="mt-1 text-right text-xs text-[#718177]">{draft.bio.length}/500</div></div>
          <div className="mt-6 flex justify-end gap-3 border-t border-[#edf1ed] pt-5"><Button type="button" variant="outline" onClick={cancelChanges}><X className="h-4 w-4" />Cancel</Button><Button type="button" isLoading={saving} onClick={saveChanges}><Save className="h-4 w-4" />Save Changes</Button></div>
        </section>

        <aside className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b583f] p-5 text-white"><img src="/images/05_seedling_fertile_soil.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8ed96]">Grow with nature</p><h3 className="mt-2 font-display text-2xl font-semibold">Better Soil<br />Better Tomorrow</h3></div></div>
          <div className="rounded-2xl border border-[#e0e9df] bg-white p-5"><h3 className="font-display text-lg font-semibold text-[#173d2b]">Quick Links</h3><div className="mt-3 space-y-1">{[{ href: "/products", label: "View Products", icon: Package }, { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart }, { href: "/admin/customers", label: "Customer List", icon: Users }, { href: "/admin", label: "Sales Report", icon: FileText }, { href: "/", label: "Site Preview", icon: ExternalLink }].map(({ href, label, icon: Icon }) => <Link key={label} href={href} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-[#52665b] hover:bg-[#f1faed] hover:text-[#4f9c42]"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4" /></Link>)}</div></div>
          <div className="rounded-2xl border border-[#e0e9df] bg-[#f3faef] p-5"><h3 className="font-display text-lg font-semibold text-[#173d2b]">Need Help?</h3><p className="mt-1 text-sm text-[#718177]">Our support team is here for you. Feel free to contact us.</p><div className="mt-4 space-y-2 text-xs text-[#52665b]"><a href={`tel:${SITE.supportPhone.replace(/\D/g, "")}`} className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#4f9c42]" />{SITE.supportPhone}</a><a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#4f9c42]" />{SITE.supportEmail}</a><span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-[#4f9c42]" />Mon–Sat, 9 AM–6 PM</span></div></div>
        </aside>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[#0b583f] px-6 py-5 text-white"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8ed96]">Natural care for every garden</p><h2 className="mt-1 font-display text-2xl font-semibold">Organic Farming for a Greener Future</h2></div><Link href="/products" className="inline-flex items-center gap-2 rounded-lg bg-[#c8ed96] px-4 py-2.5 text-sm font-semibold text-[#16452f]">Adhyantha Goat Manure <ChevronRight className="h-4 w-4" /></Link></div>
    </div>
  );
}

function Tab({ label, icon: Icon, href, active }: { label: string; icon: typeof Settings2; href?: string; active?: boolean }) {
  const className = `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${active ? "bg-[#4f9c42] text-white" : "text-[#52665b] hover:bg-[#f1faed]"}`;
  return href ? <Link href={href} className={className}><Icon className="h-4 w-4" />{label}</Link> : <button type="button" className={className}><Icon className="h-4 w-4" />{label}</button>;
}
