"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TrackOrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found");
        return;
      }
      router.push(`/track-order/${data.orderId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-canopy)]/10">
          <Search className="h-6 w-6 text-[var(--color-canopy)]" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-medium">Track Your Order</h1>
        <p className="mt-2 text-[var(--color-stone)]">
          Enter your order number along with the email or phone number used at checkout.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 text-left">
          <Input
            label="Order Number"
            placeholder="ADYA100482"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <Input
            label="Email or Phone Number"
            placeholder="you@example.com"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          {error && <p className="text-sm font-medium text-[var(--color-error)]">{error}</p>}
          <Button type="submit" size="lg" isLoading={loading}>
            Track Order
          </Button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-stone)]">
          Logged in? Find all your orders in{" "}
          <a href="/account/orders" className="font-medium text-[var(--color-canopy)] hover:underline">
            My Orders
          </a>
          .
        </p>
      </div>
    </div>
  );
}
