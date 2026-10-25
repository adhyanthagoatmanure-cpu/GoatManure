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
  supportEmail: "adhyanthagoatmanure@gmail.com",
  supportPhone: "+91 9585420222",
  whatsappPhone: "+91 9585420222",
  address: "14, Vaniga Valagam, Kovai to Karur Main Road, K. Paramathi, Karur - 639111",
  locationLabel: "Karur, Tamil Nadu, India",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d989.4646652569438!2d77.91013686957054!3d10.959142999325074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba9879954fae5cd%3A0x8ea05cdf768ec459!2sSri%20Raja%20Mobiles!5e1!3m2!1sen!2sin!4v1792831366320!5m2!1sen!2sin",
  mapDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=10.959142999325074%2C77.91013686957054",
};
