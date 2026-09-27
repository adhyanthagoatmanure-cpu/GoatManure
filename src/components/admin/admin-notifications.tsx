"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ClipboardList, Mail, Package, UserPlus, X } from "lucide-react";

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
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); if (!open) void loadNotifications(); }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e1e6e2] bg-white text-[#184a3a] transition hover:bg-[#f3f7f4] focus:outline-none focus:ring-2 focus:ring-[#69be28]/40"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#d64545] px-1 text-[9px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e3ebe2] bg-white shadow-[0_20px_45px_rgba(15,41,32,0.16)]">
          <div className="flex items-center justify-between border-b border-[#edf2eb] px-4 py-3">
            <div><h2 className="text-sm font-semibold text-[#173d2b]">Notifications</h2><p className="mt-0.5 text-[11px] text-[#849289]">{unreadCount ? `${unreadCount} unread` : "All caught up"}</p></div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && <button onClick={() => void markAllRead()} className="rounded-lg p-2 text-[#4f9c42] hover:bg-[#f1f8ee]" title="Mark all as read" aria-label="Mark all as read"><CheckCheck className="h-4 w-4" /></button>}
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#849289] hover:bg-[#f4f7f3]" aria-label="Close notifications"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifications.length === 0 && <p className="px-4 py-8 text-center text-xs text-[#849289]">Loading notifications…</p>}
            {!loading && notifications.length === 0 && <p className="px-4 py-8 text-center text-xs text-[#849289]">No notifications yet.</p>}
            {notifications.map((notification) => {
              const Icon = icons[notification.type] ?? Bell;
              const content = <><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notification.readAt ? "bg-[#f3f6f2] text-[#8da091]" : "bg-[#eaf6e2] text-[#4f9c42]"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#315b45]">{notification.title}</span><span className="mt-0.5 block text-xs leading-5 text-[#6b7a70]">{notification.message}</span><span className="mt-1 block text-[10px] text-[#9aa79d]">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}</span></span>{!notification.readAt && <i className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#69be28]" />}</>;
              return notification.href ? <Link key={notification.id} href={notification.href} onClick={() => void markRead(notification.id)} className={`flex gap-3 border-b border-[#f0f4ef] px-4 py-3 transition hover:bg-[#fbfdf9] ${notification.readAt ? "" : "bg-[#fbfdf8]"}`}>{content}</Link> : <button key={notification.id} onClick={() => void markRead(notification.id)} className={`flex w-full gap-3 border-b border-[#f0f4ef] px-4 py-3 text-left transition hover:bg-[#fbfdf9] ${notification.readAt ? "" : "bg-[#fbfdf8]"}`}>{content}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
