import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "ADHYANTHA returns, replacement, cancellation, and refund information.",
};

export default function ReturnsRefundsPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-20">
      <header>
        <p className="eyebrow">Help</p>
        <h1 className="mt-2 font-display text-4xl font-medium">Returns &amp; Refunds</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone">
          Please report a damaged, incorrect, missing, or otherwise defective delivery promptly so we can review it.
        </p>
      </header>

      <div className="mt-10 space-y-8">
        <Section title="Before opening a return request">
          Keep the original packaging and product label, photograph the package and item, and retain your order number. Do not use a product that is reported as damaged or contaminated.
        </Section>
        <Section title="Damaged or incorrect orders">
          Contact our support team within 48 hours of delivery and include the order number, photos, and a description of the issue. We will assess the delivery evidence and advise whether a replacement or refund is appropriate.
        </Section>
        <Section title="Cancellation">
          You may request cancellation before an order is dispatched. After dispatch, the order may need to be handled through the damaged/incorrect-delivery process.
        </Section>
        <Section title="Refunds">
          Approved refunds are returned to the original payment method. Processing time depends on the payment provider or bank and may take additional business days after approval.
        </Section>
        <Section title="What is not eligible">
          A product may not be eligible for return if it has been used, opened outside the normal inspection needed to identify damage, altered, or missing its required evidence and packaging. Each request is reviewed on its facts.
        </Section>
        <p>
          To submit a request, <Link href="/contact" className="font-semibold text-canopy underline">contact ADHYANTHA support</Link>.
        </p>
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
