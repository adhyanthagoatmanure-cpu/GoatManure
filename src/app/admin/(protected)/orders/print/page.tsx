import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { formatINR, formatOrderNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { PrintButton } from "@/components/admin/print-button";

export default async function PrintOrderBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const orderIds = (ids ?? "").split(",").filter(Boolean);
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { user: true, items: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="a4-bills-page">
      <div className="mb-5 flex items-center justify-between print-hidden">
        <div>
          <h1 className="font-display text-2xl font-medium">A4 Order Bills</h1>
          <p className="text-sm text-[var(--color-stone)]">Print and cut each bill manually.</p>
        </div>
        <PrintButton />
      </div>

      {orders.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-stone)] print-hidden">
          Select one or more orders from the Orders page first.
        </p>
      ) : (
        <div className="a4-bill-sheet">
          {orders.map((order) => {
            const shipping = order.shippingSnapshot as {
              fullName: string;
              phone: string;
              line1: string;
              line2?: string;
              city: string;
              state: string;
              pincode: string;
              country?: string;
            };

            return (
              <article key={order.id} className="a4-order-bill">
                <div className="flex items-start justify-between border-b border-black pb-2">
                  <div>
                    <Image
                      src="/images/brand/logo-lockup.png"
                      alt="ADHYANTHA Goat Manure"
                      width={2200}
                      height={700}
                      className="print-label-logo"
                    />
                    <h2 className="mt-1 text-lg font-bold">Order Bill</h2>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{formatOrderNumber(order.orderNumber)}</p>
                    <p>{order.createdAt.toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold uppercase">Customer</p>
                    <p className="mt-1 font-semibold">{shipping.fullName}</p>
                    <p>{shipping.phone}</p>
                    <p>{order.user?.email ?? order.guestEmail ?? ""}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">Deliver To</p>
                    <p className="mt-1">{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}</p>
                    <p>{shipping.city}, {shipping.state} {shipping.pincode}</p>
                    {shipping.country && <p>{shipping.country}</p>}
                  </div>
                </div>

                <div className="mt-4 border-y border-black py-2 text-xs">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-black pb-1 font-bold uppercase">
                    <span>Product</span><span>Qty / Size</span><span>Amount</span>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-x-3 py-1">
                      <span>{item.productName}</span>
                      <span>{item.quantity} × {item.weightLabel}</span>
                      <span>{formatINR(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span>Payment: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                  <span className="text-base font-bold">Total: {formatINR(order.totalAmount)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
