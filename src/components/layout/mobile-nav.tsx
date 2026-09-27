"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
import { Button } from "@/components/ui/button";

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
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--color-ink)]/40 backdrop-blur-[1px]"
      />
      <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-[var(--color-parchment)] shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <Logo showWordmark={false} />
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-parchment-deep)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form onSubmit={submitSearch} className="mb-5 flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-[var(--color-stone)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = ICONS[link.href] ?? Home;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3.5 text-[15px] font-medium text-[var(--color-ink)] active:bg-[var(--color-parchment-deep)]"
                >
                  <Icon className="h-5 w-5 text-[var(--color-canopy)]" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-[var(--color-border)]" />

          {session ? (
            <>
              <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-stone)]">
                My Account
              </p>
              <nav className="flex flex-col gap-1">
                <MobileAccountLink href="/account" icon={User} label="My Account" />
                <MobileAccountLink href="/account/orders" icon={Package} label="My Orders" />
                <MobileAccountLink href="/account/wishlist" icon={Heart} label="Wishlist" />
                <MobileAccountLink href="/account/addresses" icon={MapPin} label="Addresses" />
                {session.user?.role === "ADMIN" && (
                  <MobileAccountLink href="/admin" icon={LayoutDashboard} label="Go to Admin Panel" />
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3.5 text-left text-[15px] font-medium text-[var(--color-error)] active:bg-[var(--color-parchment-deep)]"
                >
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </nav>
            </>
          ) : (
            <div className="flex flex-col gap-2.5 px-1">
              <Link href="/signup" onClick={onClose}>
                <Button className="w-full" size="lg">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" onClick={onClose}>
                <Button variant="outline" className="w-full" size="lg">
                  Login
                </Button>
              </Link>
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
      className="flex items-center gap-3.5 rounded-[var(--radius-sm)] px-3 py-3.5 text-[15px] font-medium text-[var(--color-ink)] active:bg-[var(--color-parchment-deep)]"
    >
      <Icon className="h-5 w-5 text-[var(--color-stone)]" />
      {label}
    </Link>
  );
}
