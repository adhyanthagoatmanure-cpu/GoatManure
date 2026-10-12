import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RetryPayUPayment } from "@/components/checkout/retry-payu-payment";
import { canRetryPayUPayment } from "@/server/payment/payu-provider";

export default async function PaymentStatusPage({
  params,
}: {
  params: Promise<{ intentId: string }>;
}) {
  const { intentId } = await params;
  const [session, intent] = await Promise.all([
    auth(),
    prisma.paymentIntent.findUnique({ where: { id: intentId } }),
  ]);

  if (!intent || (intent.userId && intent.userId !== session?.user?.id)) notFound();
  if (intent.status === "PAID" && intent.createdOrderId) {
    redirect(`/order-success/${intent.createdOrderId}?clearCart=1`);
  }

  const rawItems = Array.isArray(intent.items)
    ? intent.items.flatMap((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
        const variantId = item.variantId;
        const quantity = item.quantity;
        if (
          typeof variantId !== "string" ||
          typeof quantity !== "number" ||
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          return [];
        }
        return [{ variantId, quantity }];
      })
    : [];
  const variantIds = rawItems.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const canRetry = canRetryPayUPayment(intent.status, intent.expiresAt);
  const failed = intent.status === "FAILED";

  return (
    <div className="container-page py-12 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ${failed ? "bg-[var(--color-error-bg)]" : "bg-[var(--color-parchment-deep)]"}`}>
            {failed
              ? <AlertCircle className="h-8 w-8 text-[var(--color-error)]" />
              : intent.status === "PROCESSING"
                ? <Clock3 className="h-8 w-8 text-[var(--color-canopy)]" />
                : <CheckCircle2 className="h-8 w-8 text-[var(--color-canopy)]" />}
          </span>
          <h1 className="mt-5 font-display text-3xl font-medium">
            {failed ? "Payment Failed" : intent.status === "PROCESSING" ? "Confirming Payment" : "Payment Status Pending"}
          </h1>
          <p className="mt-2 max-w-lg text-[var(--color-stone)]">
            {failed
              ? "Your payment was not completed. Your saved items and payment details are still available; you can retry securely below."
              : intent.status === "PROCESSING"
                ? "We are confirming your payment and preparing the order. Please do not start another payment."
                : "We have not received a final payment confirmation yet. Please wait a little and check again."}
          </p>
        </div>

        <div className="mt-8 border-y border-[var(--color-border)] py-5">
          <p className="text-xs text-[var(--color-stone)]">Payment reference</p>
          <p className="mt-1 break-all font-medium">{intent.id}</p>
          <div className="mt-4 flex justify-between text-sm font-medium">
            <span>Amount</span><span>{formatINR(intent.amount)}</span>
          </div>
        </div>

        <div className="py-5">
          <h2 className="text-sm font-semibold">Items saved for this payment</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-stone)]">
            {rawItems.map((item, index) => {
              const variant = variantById.get(item.variantId);
              return (
                <li key={`${item.variantId}-${index}`} className="flex justify-between gap-4">
                  <span>{variant ? `${variant.product.name} (${variant.weightLabel})` : "Saved cart item"}</span>
                  <span>× {item.quantity}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {canRetry && <RetryPayUPayment intentId={intent.id} />}
          <Link href="/checkout">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {canRetry ? "Return to Checkout" : "Continue to Checkout"}
            </Button>
          </Link>
        </div>
        {failed && !canRetry && (
          <p className="mt-4 text-center text-sm text-[var(--color-stone)]">
            This payment attempt has expired. Returning to checkout will let you start a new payment.
          </p>
        )}
      </section>
    </div>
  );
}
