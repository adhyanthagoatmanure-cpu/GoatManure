"use client";

import { Wallet, Banknote, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@prisma/client";

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  const options: { value: PaymentMethod; icon: typeof Wallet; title: string; description: string }[] = [
    {
      value: "ONLINE",
      icon: Wallet,
      title: "Online Payment",
      description: "UPI, Cards, Netbanking & Wallets — pay securely via PayU",
    },
    {
      value: "COD",
      icon: Banknote,
      title: "Cash on Delivery",
      description: "Pay in cash when your order is delivered",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Payment method">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "flex items-start gap-3 rounded-[var(--radius-md)] border-2 p-4 text-left transition-[background-color,border-color,box-shadow]",
            value === opt.value
              ? "border-[var(--color-canopy)] bg-[var(--color-sage)] shadow-[var(--shadow-soft)]"
              : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]"
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              value === opt.value ? "bg-[var(--color-canopy)] text-white" : "bg-[var(--color-parchment-deep)] text-[var(--color-ink)]"
            )}
          >
            <opt.icon className="h-4.5 w-4.5" />
          </span>
          <span className="flex-1">
            <span className="flex items-center gap-1.5 font-semibold">
              {opt.title}
              {value === opt.value && <Check className="h-4 w-4 text-[var(--color-canopy)]" aria-hidden="true" />}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-stone)]">{opt.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
