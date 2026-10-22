"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

const ToastContext = createContext<{ show: (message: string, variant?: "success" | "error") => void } | null>(
  null
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            data-on-dark
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-white/15 bg-[var(--color-canopy-dark)]/95 px-4 py-3 text-sm text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-gold)]" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-[var(--color-error)]" />
            )}
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Dismiss"
              className="ml-1 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
