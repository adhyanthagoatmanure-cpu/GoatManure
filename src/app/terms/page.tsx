import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-10">
        <h1 className="font-display text-3xl font-medium">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">By creating an ADHYANTHA account or using our website, you agree to use the service lawfully and provide accurate account and delivery information.</p>
        <h2 className="mt-8 font-display text-xl font-medium">Accounts and orders</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-stone)]">Keep your login details secure and review order information before confirming a purchase. We may contact you about your account, orders, delivery, or support requests.</p>
        <h2 className="mt-8 font-display text-xl font-medium">Product information</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-stone)]">We aim to keep product descriptions, pricing, availability, and delivery information accurate. Product availability and delivery timelines may change as orders are processed.</p>
        <h2 className="mt-8 font-display text-xl font-medium">Contact</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-stone)]">For questions about these terms, contact us at adhyanthagoatmanure@gmail.com.</p>
      </article>
    </div>
  );
}
