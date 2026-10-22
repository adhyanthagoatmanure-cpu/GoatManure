import { Truck, Banknote, ShieldCheck, Phone } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SHIPPING_CONFIG, SITE } from "@/lib/config";
import { formatINR } from "@/lib/utils";

/**
 * Presents information the store already has — shipping rule, payment options and
 * support contact — pulled from the same config the cart and checkout use, so the
 * numbers here can never drift from what customers are actually charged.
 */
export function TrustStrip() {
  const telHref = `tel:${SITE.supportPhone.replace(/[^\d+]/g, "")}`;
  const items = [
    {
      icon: Truck,
      title: `Free shipping above ${formatINR(SHIPPING_CONFIG.freeAboveSubtotal)}`,
      body: `Flat ${formatINR(SHIPPING_CONFIG.flatFee)} on smaller orders`,
    },
    {
      icon: Banknote,
      title: "Cash on Delivery",
      body: "Pay in cash when your order arrives",
    },
    {
      icon: ShieldCheck,
      title: "Secure online payment",
      body: "UPI, cards, netbanking & wallets via PayU",
    },
    {
      icon: Phone,
      title: "Talk to us",
      body: SITE.supportPhone,
      href: telHref,
    },
  ];

  return (
    <section aria-label="Shipping, payment and support" className="container-page relative z-10 -mt-10 sm:-mt-14">
      <Reveal>
        <ul className="glass-strong grid grid-cols-1 gap-1 rounded-[var(--radius-xl)] p-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage)] text-[var(--color-canopy)]">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 text-sm leading-snug">
                  <span className="block font-bold text-[var(--color-ink)]">{item.title}</span>
                  <span className="block text-[var(--color-stone)]">{item.body}</span>
                </span>
              </>
            );
            return (
              <li key={item.title}>
                {item.href ? (
                  <a
                    href={item.href}
                    className="flex items-center gap-3.5 rounded-[calc(var(--radius-xl)-8px)] px-4 py-3.5 transition-colors hover:bg-white/70"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3.5 px-4 py-3.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
