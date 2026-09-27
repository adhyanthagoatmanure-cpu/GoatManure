"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Users, Tag, Newspaper, MessageSquareQuote, LogOut, Leaf } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/benefits", label: "Benefits", icon: Leaf },
  { href: "/admin/contact", label: "Contact", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", icon: Tag },
];

export function AdminMobileHeader({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#184a3a] hover:bg-[#f3f7f4] lg:hidden"
        aria-label={`Open admin navigation for ${adminName}`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 right-0 w-72 bg-[var(--color-surface)] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-parchment-deep)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-3 text-sm font-medium hover:bg-[var(--color-parchment-deep)]"
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="mt-2 flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-3 text-left text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
