"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ClipboardList, Mail, Package, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "ORDER" | "CONTACT" | "CUSTOMER" | "INVENTORY";
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const icons = { ORDER: ClipboardList, CONTACT: Mail, CUSTOMER: UserPlus, INVENTORY: Package };

export function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadNotifications(), 0);
    const timer = window.setInterval(() => void loadNotifications(), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function markRead(notificationId: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    setNotifications((items) => items.map((item) => item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    // `relative` only from sm up: on phones the panel anchors to the (sticky) top bar and spans its width,
    // so it can never run off the left edge of a narrow screen.
    <div ref={ref} className="sm:relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); if (!open) void loadNotifications(); }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-edge)] bg-white/80 text-ink transition-colors hover:bg-white"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute inset-x-3 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--glass-edge)] bg-white/95 shadow-[var(--shadow-lifted)] animate-in fade-in slide-in-from-bottom-2 sm:inset-x-auto sm:right-0 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h2 className="text-sm font-semibold text-ink">Notifications</h2><p className="mt-0.5 text-xs text-stone">{unreadCount ? `${unreadCount} unread` : "All caught up"}</p></div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-canopy transition-colors hover:bg-sage sm:h-9 sm:w-9" title="Mark all as read" aria-label="Mark all as read"><CheckCheck className="h-4 w-4" aria-hidden /></button>}
              <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-stone transition-colors hover:bg-sage sm:h-9 sm:w-9" aria-label="Close notifications"><X className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-stone">Loading notifications…</p>}
            {!loading && notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-stone">No notifications yet.</p>}
            {notifications.map((notification) => {
              const Icon = icons[notification.type] ?? Bell;
              const rowClass = cn(
                "flex w-full gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors hover:bg-sage/50",
                !notification.readAt && "bg-sage/40"
              );
              const content = (
                <>
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", notification.readAt ? "bg-parchment-deep text-stone" : "bg-sage-deep/70 text-canopy")}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{notification.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-stone">{notification.message}</span>
                    <span className="mt-1 block text-xs text-stone-light">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}</span>
                  </span>
                  {!notification.readAt && <i aria-label="Unread" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf" />}
                </>
              );
              return notification.href ? (
                <Link key={notification.id} href={notification.href} onClick={() => void markRead(notification.id)} className={rowClass}>{content}</Link>
              ) : (
                <button key={notification.id} type="button" onClick={() => void markRead(notification.id)} className={rowClass}>{content}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
