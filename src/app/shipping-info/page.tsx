import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Shipping coverage, delivery estimates, and order tracking for ADHYANTHA orders.",
};

export default function ShippingInfoPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-20">
      <header>
        <p className="eyebrow">Help</p>
        <h1 className="mt-2 font-display text-4xl font-medium">Shipping Information</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone">
          Delivery availability, charges, and estimated timelines are shown during checkout for your address.
        </p>
      </header>

      <div className="mt-10 space-y-8">
        <Section title="Where we deliver">
          <p>ADHYANTHA currently supports delivery to serviceable pin codes in India. Availability is confirmed when you enter the delivery address at checkout.</p>
        </Section>
        <Section title="Processing and delivery">
          <p>Orders are normally prepared after payment confirmation or for eligible cash-on-delivery orders. The estimated delivery time shown at checkout depends on the destination, courier availability, and product preparation.</p>
        </Section>
        <Section title="Shipping charges">
          <p>Shipping charges, if applicable, are calculated from the order details and displayed before payment. A listed delivery fee is not added without being shown in the checkout summary.</p>
        </Section>
        <Section title="Order tracking">
          <p>Use the order number and contact details from your confirmation on the <Link href="/track-order" className="font-semibold text-canopy underline">Track Order</Link> page. Tracking information may take some time to appear while the courier records the shipment.</p>
        </Section>
        <Section title="Delivery issues">
          <p>If an order is delayed, marked delivered but not received, or shows another delivery problem, <Link href="/contact" className="font-semibold text-canopy underline">contact our support team</Link> with your order number.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-[var(--radius-md)] p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-3 leading-relaxed text-stone">{children}</div>
    </section>
  );
}
