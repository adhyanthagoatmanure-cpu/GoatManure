/**
 * Site-wide business constants that aren't tied to a specific product.
 * The client didn't specify a shipping policy, so this is a clearly-named,
 * easily-adjustable placeholder — change these two numbers and every price
 * shown across the storefront and admin updates with them.
 */
export const SHIPPING_CONFIG = {
  flatFee: 49,
  freeAboveSubtotal: 499,
};

export function calculateShippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= SHIPPING_CONFIG.freeAboveSubtotal ? 0 : SHIPPING_CONFIG.flatFee;
}

export const SITE = {
  name: "ADHYANTHA Goat Manure",
  shortName: "ADHYANTHA",
  tagline: "Grow Better. Naturally.",
  supportEmail: "adhyanthagoatmanure@gmail.com",
  supportPhone: "+91 9585420222",
  whatsappPhone: "+91 9798420222",
  address: "14, Vaniga Valagam, Kovai to Karur Main Road, K. Paramathi, Karur - 639111",
};
