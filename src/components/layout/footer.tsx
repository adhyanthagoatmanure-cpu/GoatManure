import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Instagram, Facebook, Youtube } from "@/components/ui/social-icons";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/lib/config";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/benefits", label: "Benefits" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/track-order", label: "Track Order" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact Us" },
      { href: "/account", label: "My Account" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/contact", label: "Shipping Info" },
      { href: "/contact", label: "Returns & Refunds" },
      { href: "/contact", label: "FAQs" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      data-on-dark
      className="relative mt-24 overflow-hidden border-t border-white/10 bg-[linear-gradient(160deg,#1c3314_0%,#24421a_55%,#2b4c1f_100%)] text-[var(--color-parchment)]"
    >
      {/* soft light bloom for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.16),transparent)]"
      />
      <div className="container-page relative py-14">
        {/* Five columns on desktop (brand, three link groups, contact); the original
            grid had six items in five tracks, which pushed "Get in Touch" onto its own row. */}
        <div className="grid grid-cols-6 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr_1.4fr] lg:gap-x-10">
          <div className="col-span-6 lg:col-span-1">
            <Logo variant="chip" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-parchment)]/80">
              100% organic goat manure fertilizer, sourced and processed for the modern Indian
              gardener and farmer. Grow better, naturally.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <SocialIcon href="#" icon={Instagram} label="Instagram" />
              <SocialIcon href="#" icon={Facebook} label="Facebook" />
              <SocialIcon href="#" icon={Youtube} label="YouTube" />
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="col-span-2 lg:col-span-1">
              <h4 className="font-display text-sm font-semibold tracking-wide text-[#e6c75a]">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[var(--color-parchment)]/80 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-6 lg:col-span-1">
            <h4 className="font-display text-sm font-semibold tracking-wide text-[#e6c75a]">Get in Touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-parchment)]/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Coimbatore, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{SITE.supportPhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <EmailText email={SITE.supportEmail} />
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-[var(--color-parchment)]/70 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/contact" className="transition-colors hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Offers a line-break opportunity before the "@" without altering the copied text. */
function EmailText({ email }: { email: string }) {
  const at = email.indexOf("@");
  if (at < 1) return <>{email}</>;
  return (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  );
}

function SocialIcon({ href, icon: Icon, label }: { href: string; icon: typeof Instagram; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
