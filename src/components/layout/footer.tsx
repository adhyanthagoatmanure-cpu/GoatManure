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
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-canopy-dark)] text-[var(--color-parchment)]">
      <div className="container-page py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="col-span-2">
            <Logo variant="chip" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-parchment)]/75">
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
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-[var(--color-gold)]">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[var(--color-parchment)]/75 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display text-sm font-semibold text-[var(--color-gold)]">Get in Touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-parchment)]/75">
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
                <span>{SITE.supportEmail}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-[var(--color-parchment)]/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon: Icon, label }: { href: string; icon: typeof Instagram; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
