"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Package, Heart, MapPin, LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/components/providers/cart-provider";
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
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-parchment)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-parchment)]/85">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-[15px] font-extrabold tracking-[0.02em] transition-colors",
                  active
                    ? "text-[var(--color-canopy)]"
                    : "text-[var(--color-ink)] hover:text-[var(--color-canopy)]"
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
              <form onSubmit={submitSearch} className="flex items-center">
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => !searchValue && setSearchOpen(false)}
                  placeholder="Search products…"
                  className="h-10 w-48 rounded-full border border-[var(--color-border-strong)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-canopy)]/30 md:w-64"
                />
              </form>
            ) : (
              <button
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
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
                  className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-canopy)] text-xs font-semibold text-white">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-1.5 shadow-lg">
                    <div className="border-b border-[var(--color-border)] px-4 py-2.5">
                      <p className="truncate text-sm font-medium">{session.user?.name}</p>
                      <p className="truncate text-xs text-[var(--color-stone)]">{session.user?.email}</p>
                    </div>
                    <AccountLink href="/account" icon={User} label="My Account" />
                    <AccountLink href="/account/orders" icon={Package} label="My Orders" />
                    <AccountLink href="/account/wishlist" icon={Heart} label="Wishlist" />
                    <AccountLink href="/account/addresses" icon={MapPin} label="Addresses" />
                    {session.user?.role === "ADMIN" && (
                      <AccountLink href="/admin" icon={LayoutDashboard} label="Go to Admin Panel" />
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-parchment-deep)]"
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
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-canopy)]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--color-canopy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-canopy-dark)]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
          >
            <ShoppingBag className="h-5 w-5" />
            {isHydrated && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-bronze)] px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)] lg:hidden"
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
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-parchment-deep)]"
    >
      <Icon className="h-4 w-4 text-[var(--color-stone)]" /> {label}
    </Link>
  );
}
