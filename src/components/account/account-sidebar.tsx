"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/hooks/use-sign-out";
import { User, Package, MapPin, Heart, KeyRound, LogOut, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/track-order", label: "Track Order", icon: Truck },
  { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/change-password", label: "Change Password", icon: KeyRound },
];

/*
  One frosted panel (the only blurred surface in the account area). On phones it becomes a
  horizontally scrollable row of pills, on tablets the pills wrap onto a second row instead of
  clipping, and from lg up it is a sticky vertical menu.
*/
export function AccountSidebar() {
  const pathname = usePathname();
  const signOutAndNavigate = useSignOut("/");
  return (
    <nav
      aria-label="Account"
      className="glass flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] p-1.5 md:flex-wrap md:overflow-visible lg:sticky lg:top-28 lg:flex-col lg:flex-nowrap lg:self-start lg:p-2.5"
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-[var(--color-canopy)] text-white shadow-[0_8px_18px_-10px_rgba(28,51,20,0.7)]"
                : "text-[var(--color-ink)] hover:bg-[var(--color-sage)]"
            )}
          >
            <link.icon className="h-4 w-4" aria-hidden /> {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => void signOutAndNavigate()}
        className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-bg)] lg:mt-2"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Logout
      </button>
    </nav>
  );
}
