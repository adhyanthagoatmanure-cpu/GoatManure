"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Users, Tag, Newspaper, MessageSquareQuote, LogOut, Leaf } from "lucide-react";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  const signOutAndNavigate = useSignOut("/admin/login");

  // Lock page scroll while the drawer is open and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sage lg:hidden"
        aria-label={`Open admin navigation for ${adminName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {/*
        Rendered through a portal: the top bar uses backdrop-filter, which would otherwise become the
        containing block of this `fixed` overlay and clip it to the header's box.
      */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
            <button
              type="button"
              className="absolute inset-0 bg-canopy-dark/45 backdrop-blur-[3px]"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
            <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-xs flex-col rounded-l-[var(--radius-xl)] border-l border-[var(--glass-edge)] bg-white/95 p-4 shadow-[var(--shadow-lifted)] supports-[backdrop-filter]:bg-white/[0.88] supports-[backdrop-filter]:backdrop-blur-xl animate-in slide-in-from-right duration-200">
              <div className="mb-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sage"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {LINKS.map((l) => {
                  const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-sage text-canopy" : "text-ink hover:bg-sage/70"
                      )}
                    >
                      <l.icon className="h-4 w-4" aria-hidden /> {l.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOutAndNavigate();
                  }}
                  className="mt-2 flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-3 text-left text-sm font-semibold text-error transition-colors hover:bg-error-bg"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Logout
                </button>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
