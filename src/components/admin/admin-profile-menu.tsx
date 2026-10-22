"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";

export function AdminProfileMenu({
  adminName,
  adminEmail,
  adminImage,
}: {
  adminName: string;
  adminEmail?: string | null;
  adminImage?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const signOutAndNavigate = useSignOut("/admin/login");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initial = (adminName ?? "A").trim().charAt(0)?.toUpperCase() ?? "A";
  const itemClass =
    "flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sage";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2.5 rounded-full border border-[var(--glass-edge)] bg-white/80 py-1 pl-1 pr-3 shadow-sm transition-colors hover:bg-white"
        aria-label="Admin profile menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {adminImage ? <img src={adminImage} alt="" className="h-9 w-9 rounded-full object-cover" /> : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-canopy text-sm font-semibold text-white">{initial}</div>
        )}
        <div className="hidden min-w-0 text-left sm:block">
          <div className="max-w-[10rem] truncate text-sm font-semibold leading-tight text-ink">{adminName}</div>
          <div className="max-w-[10rem] truncate text-xs leading-tight text-stone">{adminEmail ?? "Administrator"}</div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-stone transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[var(--radius-md)] border border-[var(--glass-edge)] bg-white/95 p-1.5 shadow-[var(--shadow-lifted)] animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            {adminImage ? <img src={adminImage} alt="" className="h-11 w-11 rounded-full object-cover" /> : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canopy text-base font-semibold text-white">{initial}</div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">{adminName}</div>
              <div className="truncate text-xs text-stone">{adminEmail ?? "Administrator"}</div>
            </div>
          </div>

          <div className="mt-1 space-y-0.5 py-1">
            <Link href="/admin" onClick={() => setOpen(false)} className={itemClass}>
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Dashboard
            </Link>
            <Link href="/account" onClick={() => setOpen(false)} className={itemClass}>
              <UserCircle2 className="h-4 w-4" aria-hidden />
              My Account
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOutAndNavigate();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold text-error transition-colors hover:bg-error-bg"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
