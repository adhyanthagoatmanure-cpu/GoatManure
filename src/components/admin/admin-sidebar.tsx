"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Newspaper,
  MessageSquareQuote,
  LogOut,
  ExternalLink,
  ChevronRight,
  Leaf,
  Settings2,
  Shield,
  Bell,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/hooks/use-sign-out";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/benefits", label: "Benefits", icon: Leaf },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/contact", label: "Contact", icon: MessageSquareQuote },
];

/*
  Contrast (all measured, design tokens):
    white on canopy-dark #1c3314 ........ 13.7:1   (idle links use white/85 ≈ 11:1)
    white on active pill (white/16 over canopy-dark ≈ #3f5238) ... ≈ 9:1
    sage-deep #d5e2c4 on canopy-dark .... 10.6:1   (captions)
  The previous lime #69be28 pill with white text was ≈ 2.4:1 and failed AA.
*/
const linkBase =
  "relative flex min-h-11 items-center justify-between rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-semibold transition-colors";
const linkIdle = "text-white/85 hover:bg-white/10 hover:text-white";
const linkActive =
  "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-inset ring-white/25 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold";

export function AdminSidebar() {
  const pathname = usePathname();
  const signOutAndNavigate = useSignOut("/admin/login");
  const onSettings = pathname.startsWith("/admin/settings");

  return (
    <aside
      data-on-dark
      className="hidden w-[250px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,var(--color-canopy-dark)_0%,var(--color-canopy)_100%)] text-white lg:flex lg:h-screen"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <Logo variant="chip" />
          <div className="leading-none">
            <div className="text-xl font-semibold tracking-[0.12em] text-white">ADHYANTHA</div>
            <div className="mt-1.5 text-xs uppercase tracking-[0.22em] text-sage-deep">Goat manure</div>
          </div>
        </div>
      </div>

      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1.5 p-3.5">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(linkBase, active ? linkActive : linkIdle)}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" aria-hidden />
                <span>{link.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
            </Link>
          );
        })}

        <div className="my-2 h-px bg-white/10" />

        <Link
          href="/admin/settings"
          aria-current={onSettings ? "page" : undefined}
          className={cn(linkBase, onSettings ? linkActive : linkIdle)}
        >
          <span className="flex items-center gap-3">
            <Settings2 className="h-4 w-4" aria-hidden />
            <span>Settings</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
        {onSettings && (
          <div className="ml-4 space-y-1 border-l border-white/20 pl-3">
            <Link href="/admin/settings" className="flex min-h-10 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white"><UserRound className="h-3.5 w-3.5" aria-hidden />Profile Settings</Link>
            <Link href="/admin/settings?tab=site" className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs text-sage-deep hover:bg-white/10 hover:text-white"><Settings2 className="h-3.5 w-3.5" aria-hidden />Site Settings</Link>
            <Link href="/admin/settings?tab=notifications" className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs text-sage-deep hover:bg-white/10 hover:text-white"><Bell className="h-3.5 w-3.5" aria-hidden />Notifications</Link>
            <Link href="/account/change-password" className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs text-sage-deep hover:bg-white/10 hover:text-white"><Shield className="h-3.5 w-3.5" aria-hidden />Security</Link>
          </div>
        )}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4 pb-5">
        {/* Brand tagline card — hidden on short viewports so the nav never has to scroll for it. */}
        <div className="rounded-[var(--radius-md)] border border-white/15 bg-white/[0.07] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] [@media(max-height:780px)]:hidden">
          <div className="font-display text-2xl italic leading-tight text-gold">Pure</div>
          <div className="font-display text-2xl italic leading-tight text-gold">Organic</div>
          <div className="font-display text-2xl italic leading-tight text-gold">Natural</div>
        </div>

        <button
          type="button"
          onClick={() => void signOutAndNavigate()}
          className="flex min-h-11 w-full items-center justify-between rounded-[var(--radius-sm)] border border-white/15 bg-white/[0.07] px-3.5 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-white/15"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Logout</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-sage-deep">
        <span>ADHYANTHA</span>
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </div>
    </aside>
  );
}
