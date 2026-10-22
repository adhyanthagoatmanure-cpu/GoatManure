import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <article className="surface mx-auto max-w-3xl rounded-[var(--radius-xl)] p-6 sm:p-10">
        <p className="eyebrow">ADHYANTHA</p>
        <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm leading-6 text-stone sm:text-base sm:leading-7">By creating an ADHYANTHA account or using our website, you agree to use the service lawfully and provide accurate account and delivery information.</p>
        <h2 className="mt-8 font-display text-xl font-medium sm:text-2xl">Accounts and orders</h2>
        <p className="mt-2 text-sm leading-6 text-stone sm:text-base sm:leading-7">Keep your login details secure and review order information before confirming a purchase. We may contact you about your account, orders, delivery, or support requests.</p>
        <h2 className="mt-8 font-display text-xl font-medium sm:text-2xl">Product information</h2>
        <p className="mt-2 text-sm leading-6 text-stone sm:text-base sm:leading-7">We aim to keep product descriptions, pricing, availability, and delivery information accurate. Product availability and delivery timelines may change as orders are processed.</p>
        <h2 className="mt-8 font-display text-xl font-medium sm:text-2xl">Contact</h2>
        <p className="mt-2 text-sm leading-6 text-stone sm:text-base sm:leading-7">For questions about these terms, contact us at <a className="font-semibold text-canopy underline underline-offset-4" href="mailto:adhyanthagoatmanure@gmail.com">adhyanthagoatmanure@gmail.com</a>.</p>
      </article>
    </div>
  );
}
