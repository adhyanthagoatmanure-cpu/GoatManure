"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/benefits", label: "Benefits", icon: Leaf },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/contact", label: "Contact", icon: MessageSquareQuote },
  { href: "/admin/login", label: "Login/Signup", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col bg-[#003d27] text-[#edf7f2] lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <Logo variant="chip" />
          <div className="leading-none">
            <div className="text-xl font-semibold tracking-[0.12em] text-[#f4f9f6]">ADHYANTHA</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.26em] text-[#d9f2e5]">Goat manure</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-3.5">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[#69be28] text-white shadow-[0_6px_15px_rgba(105,190,40,0.2)]"
                  : "text-[#eaf5ef] hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </Link>
          );
        })}

        <div className="my-2 h-px bg-white/10" />

        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/admin/settings") ? "bg-[#69be28] text-white" : "text-[#eaf5ef] hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-3">
            <Settings2 className="h-4 w-4" />
            <span>Settings</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-80" />
        </Link>
        {pathname.startsWith("/admin/settings") && (
          <div className="ml-4 space-y-1 border-l border-white/20 pl-3">
            <Link href="/admin/settings" className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white"><UserRound className="h-3.5 w-3.5" />Profile Settings</Link>
            <Link href="/admin/settings?tab=site" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#d9f2e5] hover:bg-white/5"><Settings2 className="h-3.5 w-3.5" />Site Settings</Link>
            <Link href="/admin/settings?tab=notifications" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#d9f2e5] hover:bg-white/5"><Bell className="h-3.5 w-3.5" />Notifications</Link>
            <Link href="/account/change-password" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#d9f2e5] hover:bg-white/5"><Shield className="h-3.5 w-3.5" />Security</Link>
          </div>
        )}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4 pb-6">
        <div className="rounded-3xl border border-white/10 bg-[#0f4a37]/60 p-4 text-center text-[#effaf4]">
          <div className="font-[cursive] text-3xl leading-none text-[#f7e7b5]">Pure</div>
          <div className="mt-1 font-[cursive] text-3xl leading-none text-[#f7e7b5]">Organic</div>
          <div className="mt-1 font-[cursive] text-3xl leading-none text-[#f7e7b5]">Natural</div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left text-sm font-medium text-[#edf7f2] transition-colors hover:bg-white/8"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-80" />
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.24em] text-[#d9f2e5]">
        <span>ADHYANTHA</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </div>
    </aside>
  );
}
