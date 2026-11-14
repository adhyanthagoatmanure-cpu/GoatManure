import { z } from "zod";
import { indianMobileNumberSchema, normalizeIndianMobileNumber } from "./phone";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's full name").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(25),
  line1: z.string().trim().min(5, "Enter your full address"),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city"),
  state: z.string().trim(),
  pincode: z.string().trim().max(20),
  country: z.string().trim().min(1, "Country is required"),
}).superRefine((address, ctx) => {
  if (address.country.toLowerCase() === "india") {
    if (address.state.length < 2) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "Enter a state" });
    }
    if (!indianMobileNumberSchema.safeParse(address.phone).success) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid 10-digit Indian mobile number" });
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode)) {
      ctx.addIssue({ code: "custom", path: ["pincode"], message: "Enter a valid 6-digit PIN code" });
    }
    return;
  }

  if (!/^[+0-9\s().-]+$/.test(address.phone) || (address.phone.match(/\d/g)?.length ?? 0) < 6) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid international phone number" });
  }
  if (address.pincode && !/^[A-Za-z0-9][A-Za-z0-9 -]{0,19}$/.test(address.pincode)) {
    ctx.addIssue({ code: "custom", path: ["pincode"], message: "Enter a valid postal code" });
  }
}).transform((address) => ({
  ...address,
  phone: address.country.toLowerCase() === "india"
    ? normalizeIndianMobileNumber(address.phone)
    : address.phone,
}));

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  guestName: z.string().trim().min(2, "Enter your full name").max(100).optional(),
  guestEmail: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
  guestPhone: z.string().trim().min(6).max(25).optional(),
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  couponCode: z.string().trim().toUpperCase().optional().or(z.literal("")),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Your cart is empty"),
  customerNote: z.string().trim().max(500).optional(),
}).transform((input) => ({
  ...input,
  guestPhone: input.guestPhone && input.newAddress?.country.toLowerCase() !== "india"
    ? input.guestPhone
    : input.guestPhone
      ? normalizeIndianMobileNumber(input.guestPhone)
      : undefined,
}));

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code"),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Enter a subject").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(2000),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().trim().min(2, "Enter your name").max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Tell us a bit more").max(1000),
});
