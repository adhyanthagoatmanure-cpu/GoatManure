"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, AlertTriangle } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { usePricedCart } from "@/hooks/use-priced-cart";
import { useToast } from "@/components/providers/toast-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { OrderSummary } from "@/components/cart/order-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { setQuantity, removeItem, isHydrated } = useCart();
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const { data: priced, isLoading, refresh } = usePricedCart(couponCode);
  const { show } = useToast();
  const router = useRouter();

  if (!isHydrated || (isLoading && !priced)) return <PageSpinner />;
  if (!priced) return null;

  const isEmpty = priced.lines.length === 0;
  const hasStockIssues = priced.stockIssues.length > 0;
  const hasUnavailable = priced.unavailableVariantIds.length > 0;

  function handleQuantityChange(variantId: string, quantity: number) {
    setQuantity(variantId, quantity);
  }

  function handleRemove(variantId: string) {
    removeItem(variantId);
    show("Item removed from cart");
  }

  function handleApplyCoupon(code: string) {
    setCouponCode(code);
  }

  function handleCheckout() {
    if (hasStockIssues || hasUnavailable) {
      show("Please resolve the stock issues in your cart before checking out", "error");
      return;
    }
    router.push("/checkout");
  }

  if (isEmpty) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Browse our organic fertilizers and get growing."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-medium sm:text-4xl">Your Cart</h1>

      {hasUnavailable && (
        <div className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Some items in your cart are no longer available and have been excluded from your total.</span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 sm:px-6">
          {priced.lines.map((line) => (
            <CartLineItem
              key={line.variantId}
              line={line}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <OrderSummary
            priced={priced}
            couponInput={couponCode}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={() => setCouponCode(undefined)}
            isApplyingCoupon={isLoading}
            footer={
              <div className="mt-5 flex flex-col gap-2.5">
                <Button size="lg" className="w-full" onClick={handleCheckout} disabled={hasStockIssues}>
                  Proceed to Checkout
                </Button>
                <Link href="/products">
                  <Button size="lg" variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4" /> Continue Shopping
                  </Button>
                </Link>
              </div>
            }
          />
          {hasStockIssues && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-4 py-3 text-xs font-medium text-[var(--color-error)]">
              Reduce the quantity on the highlighted item(s) above — we don&apos;t have enough stock to fulfill your current cart.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
