"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type PayUCheckout = { actionUrl: string; fields: Record<string, string> };

export function RetryPayUPayment({ intentId }: { intentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [checkout, setCheckout] = useState<PayUCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (checkout) formRef.current?.submit();
  }, [checkout]);

  async function retryPayment() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payment/payu/retry/${encodeURIComponent(intentId)}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to retry payment. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setCheckout(data.payuCheckout as PayUCheckout);
    } catch {
      setError("Unable to retry payment. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {checkout && (
        <form ref={formRef} action={checkout.actionUrl} method="post" className="hidden">
          {Object.entries(checkout.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}
      {error && (
        <p className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      <Button size="lg" onClick={retryPayment} isLoading={isSubmitting} className="w-full sm:w-auto">
        Retry Payment
      </Button>
    </>
  );
}
