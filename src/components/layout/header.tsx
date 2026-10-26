"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, ShoppingBag, User, Menu, ChevronDown, Package, Heart, MapPin, LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/components/providers/cart-provider";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/benefits", label: "Benefits" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const signOutAndNavigate = useSignOut("/");
  const { itemCount, isHydrated } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue("");
    }
  }

  return (
    <>
      {/* Frosted header: translucent + blurred where supported, near-opaque white elsewhere. */}
      <header className="sticky top-0 z-50 border-b border-[var(--glass-edge)] bg-white/95 shadow-[inset_0_-1px_0_rgba(255,255,255,0.6),0_12px_32px_-22px_rgba(28,51,20,0.45)] supports-[backdrop-filter]:bg-white/[0.74] supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Logo />

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--color-sage)] text-[var(--color-canopy)]"
                    : "text-[var(--color-ink)]/80 hover:bg-white/80 hover:text-[var(--color-canopy)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative hidden sm:block">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center" role="search">
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => !searchValue && setSearchOpen(false)}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="h-10 w-48 rounded-full border border-[var(--color-field-border)] bg-white/90 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-[var(--color-canopy)]/15 md:w-64"
                />
              </form>
            ) : (
              <button
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors hover:bg-white/80"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Account */}
          <div className="relative hidden sm:block" ref={accountRef}>
            {status === "authenticated" ? (
              <>
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[var(--color-ink)] transition-colors hover:bg-white/80"
                >
                  <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--color-canopy)] text-xs font-semibold text-white">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt=""
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      session.user?.name?.[0]?.toUpperCase() ?? "U"
                    )}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", accountOpen && "rotate-180")} />
                </button>
                {accountOpen && (
                  <div className="glass-strong absolute right-0 mt-2 w-60 overflow-hidden rounded-[var(--radius-md)] py-1.5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="border-b border-[var(--color-border)] px-4 py-2.5">
                      <p className="truncate text-sm font-semibold">{session.user?.name}</p>
                      <p className="truncate text-xs text-[var(--color-stone)]">{session.user?.email}</p>
                    </div>
                    {session.user?.role === "ADMIN" && (
                      <AccountLink href="/admin" icon={LayoutDashboard} label="Go to Admin Panel" />
                    )}
                    {session.user?.role !== "ADMIN" && (
                      <>
                        <AccountLink href="/account" icon={User} label="My Account" />
                        <AccountLink href="/account/orders" icon={Package} label="My Orders" />
                        <AccountLink href="/account/wishlist" icon={Heart} label="Wishlist" />
                        <AccountLink href="/account/addresses" icon={MapPin} label="Addresses" />
                      </>
                    )}
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        void signOutAndNavigate();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-bg)]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-white/80 hover:text-[var(--color-canopy)]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--color-canopy)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(28,51,20,0.65)] transition-colors hover:bg-[var(--color-canopy-dark)]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={isHydrated && itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors hover:bg-white/80"
          >
            <ShoppingBag className="h-5 w-5" />
            {isHydrated && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-bronze)] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors hover:bg-white/80 lg:hidden"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
        </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={NAV_LINKS}
        session={session}
      />
    </>
  );
}

function AccountLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sage)]"
    >
      <Icon className="h-4 w-4 text-[var(--color-stone)]" /> {label}
    </Link>
  );
}
