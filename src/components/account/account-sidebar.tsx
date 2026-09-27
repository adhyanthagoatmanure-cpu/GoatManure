"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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

export function AccountSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-[var(--color-canopy)] text-white" : "text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
            )}
          >
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-2 flex shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </nav>
  );
}
