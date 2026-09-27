import { z } from "zod";

// NOTE: these schemas intentionally avoid zod's `.default()` on any field.
// `.default()` makes Zod's inferred INPUT type differ from its OUTPUT type
// (the field becomes optional pre-parse, required post-parse), which
// conflicts with @hookform/resolvers' zodResolver typing against
// react-hook-form's useForm<T>. Runtime defaults are supplied instead via
// each form component's `useForm({ defaultValues })`.

export const productVariantSchema = z.object({
  id: z.string().optional(), // present when editing an existing variant
  weightLabel: z.string().trim().min(1, "Required"),
  weightValue: z.number().positive("Must be greater than 0"),
  weightUnit: z.string().trim().min(1),
  sku: z.string().trim().optional().or(z.literal("")),
  originalPrice: z.number().int().nonnegative(),
  offerPrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  isDefault: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, "Enter a product name").max(150),
  slug: z.string().trim().min(3).max(150).optional(), // auto-generated if omitted
  shortDescription: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Add a description"),
  howToUse: z.string().trim().optional().or(z.literal("")),
  shippingInfo: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  images: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
  featured: z.boolean(),
  sku: z.string().trim().optional().or(z.literal("")),
  benefits: z.array(z.object({ title: z.string().min(1), icon: z.string().optional() })),
  variants: z.array(productVariantSchema).min(1, "Add at least one weight variant"),
});

export type ProductInput = z.infer<typeof productSchema>;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "At least 3 characters")
      .regex(/^[A-Z0-9]+$/, "Letters and numbers only"),
    discountType: z.enum(["FIXED", "PERCENTAGE"]),
    value: z.number().positive("Must be greater than 0"),
    minOrderAmount: z.number().int().nonnegative(),
    maxDiscount: z.number().int().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive(),
    startsAt: z.string().optional().or(z.literal("")),
    expiresAt: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
  })
  .refine((d) => d.discountType !== "PERCENTAGE" || d.value <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponSchema>;

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(200),
  slug: z.string().trim().min(3).max(200).optional(),
  excerpt: z.string().trim().min(10, "Add a short excerpt").max(300),
  content: z.string().trim().min(20, "Add the article content"),
  featuredImage: z.string().refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), "Enter a valid image URL or upload an image").optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  author: z.string().trim().min(1),
  status: z.enum(["PUBLISHED", "DRAFT"]),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2, "Enter a name").max(100),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(10, "Add the review text").max(1000),
  image: z.string().optional().or(z.literal("")),
  isDemo: z.boolean(),
  isPublished: z.boolean(),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z
    .enum(["NEW", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"])
    .optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "COD_PENDING", "COD_COLLECTED"]).optional(),
  shipmentStatus: z
    .enum(["NOT_CREATED", "READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"])
    .optional(),
  shippingProvider: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  adminNote: z.string().trim().max(500).optional(),
  note: z.string().trim().max(300).optional(),
});
