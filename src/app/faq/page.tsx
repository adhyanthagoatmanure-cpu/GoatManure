import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about ADHYANTHA products, orders, shipping, and support.",
};

const QUESTIONS = [
  {
    question: "What is ADHYANTHA goat manure fertilizer?",
    answer: "ADHYANTHA provides processed goat manure fertilizer intended to support soil health and plant growth. Always follow the product directions and dosage information shown on the product page or package.",
  },
  {
    question: "How should I apply the fertilizer?",
    answer: "Application instructions vary by product and plant type. Use the application guidance shown on the selected product page and follow the instructions on the package.",
  },
  {
    question: "How can I track my order?",
    answer: "Open the Track Order page and enter the details from your order confirmation.",
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery estimates depend on product preparation, the destination address, and courier serviceability. The applicable estimate and shipping charge are shown during checkout.",
  },
  {
    question: "Can I change or cancel an order?",
    answer: "Contact support as soon as possible. Changes or cancellations are possible only while the order has not progressed to dispatch.",
  },
  {
    question: "What should I do if an item arrives damaged?",
    answer: "Do not use the item. Keep its packaging and contact support within 48 hours with photos and your order number.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-20">
      <header>
        <p className="eyebrow">Help</p>
        <h1 className="mt-2 font-display text-4xl font-medium">Frequently Asked Questions</h1>
        <p className="mt-4 text-stone">Quick answers about products, orders, delivery, and support.</p>
      </header>
      <div className="mt-10 space-y-4">
        {QUESTIONS.map(({ question, answer }) => (
          <section key={question} className="surface rounded-[var(--radius-md)] p-6">
            <h2 className="font-display text-lg font-semibold">{question}</h2>
            <p className="mt-3 leading-relaxed text-stone">{answer}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-stone">
        Still need help? <Link href="/contact" className="font-semibold text-canopy underline">Contact ADHYANTHA support</Link>.
      </p>
    </div>
  );
}
