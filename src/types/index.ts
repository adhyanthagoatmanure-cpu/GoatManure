import type {
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  PaymentMethod,
} from "@prisma/client";

/** A single line in the client-side cart (localStorage-backed). Kept minimal —
 * price is intentionally NOT trusted from here; the server always re-prices
 * from the database at checkout. */
export interface CartLine {
  variantId: string;
  quantity: number;
}

/** Cart line enriched with product/variant data for rendering — fetched fresh
 * from the server whenever the cart page loads. */
export interface CartLineView {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  weightLabel: string;
  offerPrice: number;
  originalPrice: number;
  quantity: number;
  stock: number;
}

export interface OrderPricing {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode?: string | null;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  COD_PENDING: "COD — Pending Collection",
  COD_COLLECTED: "COD — Collected",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  NOT_CREATED: "Not Created",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE: "Online Payment",
  COD: "Cash on Delivery",
};

export type StatusTone = "neutral" | "success" | "warning" | "error" | "info";

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  NEW: "info",
  CONFIRMED: "info",
  PROCESSING: "warning",
  PACKED: "warning",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "error",
};
