import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ADHYANTHA collects, uses, protects, and manages personal information.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    body: [
      "We collect information you provide when you create an account, place an order, contact us, or use features of the website. This may include your name, email address, phone number, delivery address, account credentials, order details, and messages you send to us.",
      "We may also receive limited technical information, such as device, browser, and website usage information, when you visit the website.",
    ],
  },
  {
    title: "Account Information",
    body: [
      "If you create an ADHYANTHA account, we use your account information to sign you in, manage your profile, save permitted addresses, show your orders, and provide account support. Please keep your login details confidential and contact us if you believe your account has been used without permission.",
    ],
  },
  {
    title: "Google and Facebook Login",
    body: [
      "You may be able to sign in using Google or Facebook Login. With your permission, the relevant provider may share basic account information such as your name and email address with us. We use that information to create or access your ADHYANTHA account and to provide the requested service.",
      "Your use of Google or Facebook Login is also subject to the privacy policy and terms of the relevant provider. We do not receive your provider password.",
    ],
  },
  {
    title: "Order and Delivery Information",
    body: [
      "When you place an order, we collect the information needed to process and deliver it, including ordered products, quantities, order value, payment method, customer contact details, and delivery address. We retain an order record so we can provide order confirmation, delivery updates, customer support, and legal or accounting records.",
    ],
  },
  {
    title: "Payment Information",
    body: [
      "Online payment information may be processed by the website's payment provider. The website does not unnecessarily store sensitive card information such as full card numbers or card security codes. Payment providers process payment data according to their own terms and privacy policies.",
    ],
  },
  {
    title: "WhatsApp Notifications",
    body: [
      "If you provide a phone number with your order, we may use WhatsApp to send order-related notifications, such as confirmation messages. These messages are limited to the order and delivery service. We do not use WhatsApp order notifications as a substitute for your account or payment security controls.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "We use personal information to operate the website, create and manage accounts, process and deliver orders, process payments through approved providers, provide customer support, send order-related communications, prevent fraud or misuse, improve our services, and comply with applicable legal obligations.",
      "We do not sell your personal information. We may share information with service providers only where reasonably necessary to provide these services or meet legal obligations.",
    ],
  },
  {
    title: "Cookies and Similar Technologies",
    body: [
      "The website may use cookies and similar technologies to keep you signed in, remember shopping-cart activity, maintain security, and understand website usage. You can control cookies through your browser settings, but disabling some cookies may affect account, cart, or checkout functionality.",
    ],
  },
  {
    title: "Third-Party Services",
    body: [
      "We may use trusted third-party services for authentication, payment processing, email, hosting, analytics, delivery, and WhatsApp messaging. These providers receive only the information needed for their service and handle it under their own terms and privacy policies.",
    ],
  },
  {
    title: "Data Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards to protect personal information. No internet transmission or storage system can be guaranteed to be completely secure, so please use the website only through a trusted device and connection.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We retain information for as long as reasonably needed to provide services, maintain order and accounting records, resolve disputes, prevent misuse, and meet legal obligations. Retention periods may differ depending on the type of information and the purpose for which it was collected.",
    ],
  },
  {
    title: "User Data Deletion",
    body: [
      "You may request deletion of your ADHYANTHA account and personal data by contacting us using the details below. We may need to verify your identity before processing the request. Some information may be retained where required for completed orders, legal compliance, fraud prevention, or other legitimate business purposes.",
      "Please include the email address or phone number associated with your account so we can identify your request.",
    ],
  },
  {
    title: "Your Privacy Rights",
    body: [
      "Depending on applicable law, you may have the right to request access to, correction of, or deletion of your personal information, and to ask questions about how it is used. You may also withdraw consent for optional communications. Contact us to exercise a right or raise a privacy concern.",
    ],
  },
  {
    title: "Children's Privacy",
    body: [
      "Our website is not directed to children. We do not knowingly collect personal information from children. If you believe a child has provided personal information, please contact us so we can review and take appropriate action.",
    ],
  },
  {
    title: "Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy when our services, technology, or legal obligations change. The updated version will be posted on this page with a revised Last updated date. Your continued use of the website after an update means you have read the updated policy.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div>
      <header className="border-b border-[var(--color-border)] bg-[var(--color-parchment-deep)]/60 py-14 sm:py-20">
        <div className="container-page max-w-4xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            ADHYANTHA
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">Privacy Policy</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-stone)]">
            This policy explains how ADHYANTHA handles information when you visit our website,
            create an account, or place an order.
          </p>
          <p className="mt-5 text-sm font-semibold text-[var(--color-ink)]">Last updated: September 16, 2026</p>
        </div>
      </header>

      <main className="container-page max-w-4xl py-12 sm:py-20">
        <div className="space-y-10 sm:space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-2xl font-medium sm:text-3xl">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--color-stone)] sm:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="font-display text-2xl font-medium sm:text-3xl">Contact Us</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--color-stone)] sm:text-base">
              <p>
                For privacy questions, account or data deletion requests, or corrections to your
                information, please contact ADHYANTHA through our contact page or the support
                details currently listed on the website.
              </p>
              <p>
                Email: <a className="font-semibold text-[var(--color-canopy)] underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
              </p>
              <p>
                You can also use the <Link className="font-semibold text-[var(--color-canopy)] underline" href="/contact">ADHYANTHA contact page</Link>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}