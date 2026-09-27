"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const initial = (adminName ?? "A").trim().charAt(0)?.toUpperCase() ?? "A";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-[#dfe7df] bg-white/90 px-2 py-1.5 shadow-sm transition hover:bg-white"
        aria-label="Admin profile menu"
      >
        {adminImage ? <img src={adminImage} alt="" className="h-10 w-10 rounded-full object-cover shadow-inner" /> : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f5d46] text-sm font-semibold text-white shadow-inner">{initial}</div>
        )}
        <div className="hidden min-w-0 text-left sm:block">
          <div className="truncate text-sm font-semibold text-[#173b2d]">{adminName}</div>
          <div className="truncate text-[11px] text-[#5f786f]">{adminEmail ?? "Administrator"}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-[#355d50]" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-[22px] border border-[#e3e7e3] bg-white p-2 shadow-[0_20px_45px_rgba(15,41,32,0.12)]">
          <div className="flex items-center gap-3 border-b border-[#edf0ee] px-3 py-3">
            {adminImage ? <img src={adminImage} alt="" className="h-12 w-12 rounded-full object-cover" /> : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f5d46] text-base font-semibold text-white">{initial}</div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#173b2d]">{adminName}</div>
              <div className="truncate text-xs text-[#5f786f]">{adminEmail ?? "Administrator"}</div>
            </div>
          </div>

          <div className="mt-1 space-y-1 py-1">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#234c3e] transition hover:bg-[#f2f8f4]"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#234c3e] transition hover:bg-[#f2f8f4]"
            >
              <UserCircle2 className="h-4 w-4" />
              My Account
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#b84f4f] transition hover:bg-[#fff2f2]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
