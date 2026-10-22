"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import {
  X,
  Search,
  Home,
  Leaf,
  Sparkles,
  MessageSquareQuote,
  Newspaper,
  Phone,
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-sign-out";

const ICONS: Record<string, typeof Home> = {
  "/": Home,
  "/products": Leaf,
  "/benefits": Sparkles,
  "/testimonials": MessageSquareQuote,
  "/blog": Newspaper,
  "/contact": Phone,
};

export function MobileNav({
  open,
  onClose,
  navLinks,
  session,
}: {
  open: boolean;
  onClose: () => void;
  navLinks: { href: string; label: string }[];
  session: Session | null;
}) {
  const router = useRouter();
  const signOutAndNavigate = useSignOut("/");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Site menu">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--color-canopy-dark)]/45 backdrop-blur-[3px]"
      />
      <div className="glass-strong absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col rounded-l-[var(--radius-xl)] border-r-0 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <Logo showWordmark={false} />
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-sage)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form
            onSubmit={submitSearch}
            role="search"
            className="mb-5 flex items-center gap-2 rounded-full border border-[var(--color-field-border)] bg-white/90 px-4 py-2.5 focus-within:ring-4 focus-within:ring-[var(--color-canopy)]/15"
          >
            <Search className="h-4 w-4 text-[var(--color-stone)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </form>

          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = ICONS[link.href] ?? Home;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-12 items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3 text-[15px] font-semibold text-[var(--color-ink)] transition-colors active:bg-[var(--color-sage)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-sage)]">
                    <Icon className="h-4.5 w-4.5 text-[var(--color-canopy)]" />
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-[var(--color-border)]" />

          {session ? (
            <>
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-stone)]">
                My Account
              </p>
              <nav aria-label="Account" className="flex flex-col gap-1">
                <MobileAccountLink href="/account" icon={User} label="My Account" />
                <MobileAccountLink href="/account/orders" icon={Package} label="My Orders" />
                <MobileAccountLink href="/account/wishlist" icon={Heart} label="Wishlist" />
                <MobileAccountLink href="/account/addresses" icon={MapPin} label="Addresses" />
                {session.user?.role === "ADMIN" && (
                  <MobileAccountLink href="/admin" icon={LayoutDashboard} label="Go to Admin Panel" />
                )}
                <button
                  onClick={() => {
                    onClose();
                    void signOutAndNavigate();
                  }}
                  className="flex min-h-12 items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3 text-left text-[15px] font-semibold text-[var(--color-error)] transition-colors active:bg-[var(--color-error-bg)]"
                >
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </nav>
            </>
          ) : (
            <div className="flex flex-col gap-2.5 px-1">
              <ButtonLink href="/signup" onClick={onClose} className="w-full" size="lg">
                Sign Up
              </ButtonLink>
              <ButtonLink href="/login" onClick={onClose} variant="outline" className="w-full" size="lg">
                Login
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileAccountLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3 text-[15px] font-semibold text-[var(--color-ink)] transition-colors active:bg-[var(--color-sage)]"
    >
      <Icon className="h-5 w-5 text-[var(--color-stone)]" />
      {label}
    </Link>
  );
}
