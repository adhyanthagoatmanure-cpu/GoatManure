"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { usePricedCart } from "@/hooks/use-priced-cart";
import { useToast } from "@/components/providers/toast-provider";
import { AddressForm } from "@/components/checkout/address-form";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { OrderSummary } from "@/components/cart/order-summary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatINR } from "@/lib/utils";
import type { AddressInput } from "@/lib/validations/checkout";
import type { Address, PaymentMethod } from "@prisma/client";

type PayUCheckout = { actionUrl: string; fields: Record<string, string> };

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { lines, clearCart, isHydrated } = useCart();
  const router = useRouter();
  const { show } = useToast();

  const [couponCode, setCouponCode] = useState<string | undefined>();
  const { data: priced, isLoading: isPricing } = usePricedCart(couponCode);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressInput | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [payuCheckout, setPayuCheckout] = useState<PayUCheckout | null>(null);
  const payuFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/addresses")
        .then((r) => r.json())
        .then((data) => {
          setAddresses(data.addresses ?? []);
          const def = data.addresses?.find((a: Address) => a.isDefault) ?? data.addresses?.[0];
          if (def) setSelectedAddressId(def.id);
          else setShowNewAddressForm(true);
        });
    } else if (status === "unauthenticated") {
      setShowNewAddressForm(true);
    }
  }, [status]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentResult = url.searchParams.get("payment");
    if (paymentResult === "failed") setPlaceError("PayU payment failed. Your order was not placed; you can try again.");
    if (paymentResult === "pending") setPlaceError("PayU is still processing the payment. Please check your payment status before trying again.");
    if (paymentResult) {
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    if (payuCheckout) payuFormRef.current?.submit();
  }, [payuCheckout]);

  if (!isHydrated || status === "loading" || (isPricing && !priced)) return <PageSpinner />;

  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few products before heading to checkout."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      </div>
    );
  }
  if (!priced) return null;

  function validateGuestFields() {
    const errors: Record<string, string> = {};
    if (!guestName.trim() || guestName.trim().length < 2) errors.guestName = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.guestEmail = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(guestPhone)) errors.guestPhone = "Enter a valid 10-digit mobile number";
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function placeOrder() {
    setPlaceError(null);

    if (!session) {
      if (!validateGuestFields()) return;
    }
    if (!selectedAddressId && !newAddress) {
      setPlaceError("Please add a shipping address to continue.");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: session ? undefined : guestName,
          guestEmail: session ? undefined : guestEmail,
          guestPhone: session ? undefined : guestPhone,
          addressId: !showNewAddressForm ? selectedAddressId ?? undefined : undefined,
          newAddress: showNewAddressForm ? newAddress ?? undefined : undefined,
          couponCode,
          paymentMethod,
          items: lines,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPlaceError(data.error ?? "Something went wrong placing your order.");
        setPlacingOrder(false);
        return;
      }

      if (paymentMethod === "COD") {
        clearCart();
        router.push(`/order-success/${data.orderId}`);
        return;
      }

      if (!data.payuCheckout?.actionUrl || !data.payuCheckout?.fields) {
        setPlaceError("PayU checkout isn't available right now — please try Cash on Delivery.");
        setPlacingOrder(false);
        return;
      }
      setPayuCheckout(data.payuCheckout);
    } catch {
      setPlaceError("Something went wrong. Please try again.");
      setPlacingOrder(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      {payuCheckout && (
        <form ref={payuFormRef} action={payuCheckout.actionUrl} method="post" className="hidden">
          {Object.entries(payuCheckout.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}
      <h1 className="font-display text-3xl font-medium sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          {!session && (
            <Section title="Contact Information" step={1}>
              <p className="mb-3 text-sm text-[var(--color-stone)]">
                Checking out as a guest.{" "}
                <button onClick={() => router.push("/login?callbackUrl=/checkout")} className="font-medium text-[var(--color-canopy)] hover:underline">
                  Log in
                </button>{" "}
                for faster checkout next time.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} error={guestErrors.guestName} />
                <Input label="Phone Number" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} error={guestErrors.guestPhone} />
              </div>
              <div className="mt-4">
                <Input label="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} error={guestErrors.guestEmail} />
              </div>
            </Section>
          )}

          <Section title="Shipping Address" step={session ? 1 : 2}>
            {addresses.length > 0 && !showNewAddressForm && (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-[var(--radius-md)] border-2 p-4 text-left",
                      selectedAddressId === addr.id ? "border-[var(--color-canopy)] bg-[var(--color-canopy)]/5" : "border-[var(--color-border)]"
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-stone)]" />
                    <span className="text-sm">
                      <span className="font-medium">{addr.fullName}</span> — {addr.phone}
                      <br />
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="flex items-center gap-2 self-start text-sm font-medium text-[var(--color-canopy)] hover:underline"
                >
                  <Plus className="h-4 w-4" /> Ship to a new address
                </button>
              </div>
            )}

            {(showNewAddressForm || addresses.length === 0) && (
              <>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewAddressForm(false)}
                    className="mb-3 text-sm font-medium text-[var(--color-canopy)] hover:underline"
                  >
                    ← Use a saved address
                  </button>
                )}
                <AddressForm
                  defaultValues={newAddress ?? undefined}
                  submitLabel="Use this Address"
                  onSubmit={(values) => {
                    setNewAddress(values);
                    show("Address saved for this order");
                  }}
                />
                {newAddress && (
                  <p className="mt-2 text-xs font-medium text-[var(--color-success)]">
                    ✓ Address ready — continue to payment below.
                  </p>
                )}
              </>
            )}
          </Section>

          <Section title="Payment Method" step={session ? 2 : 3}>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <OrderSummary
            priced={priced}
            couponInput={couponCode}
            onApplyCoupon={setCouponCode}
            onRemoveCoupon={() => setCouponCode(undefined)}
            isApplyingCoupon={isPricing}
            footer={
              <div className="mt-5">
                {placeError && (
                  <p className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--color-error)]">
                    {placeError}
                  </p>
                )}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={placeOrder}
                  isLoading={placingOrder}
                  disabled={priced.stockIssues.length > 0}
                >
                  Place Order — {formatINR(priced.totalAmount)}
                </Button>
                <p className="mt-2.5 text-center text-xs text-[var(--color-stone)]">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-medium">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-canopy)] text-xs font-semibold text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
