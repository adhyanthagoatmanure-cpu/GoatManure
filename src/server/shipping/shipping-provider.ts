/**
 * Shipping/courier abstraction.
 *
 * The admin order screen talks only to this interface, never to a specific
 * courier's API. Today "manual" is implemented — the admin types in a
 * provider name and AWB/tracking number by hand after booking the shipment
 * on the courier's own dashboard, which is how most Indian D2C sellers
 * operate on day one. When the business is ready to automate booking,
 * implement this interface against Shiprocket / Delhivery / a courier
 * aggregator's API and register it in `getShippingProvider()` — nothing in
 * the order flow, admin UI, or database needs to change, since ProductVariant
 * stock and Order.shippingProvider/trackingNumber/shipmentStatus are already
 * provider-agnostic fields.
 */

import type { ShipmentStatus } from "@prisma/client";

export interface CreateShipmentInput {
  orderId: string;
  provider: string;
  weightKg: number;
  codAmount: number; // 0 for prepaid orders
  destinationPincode: string;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  provider: string;
  status: ShipmentStatus;
  labelUrl?: string;
}

export interface ShippingProvider {
  readonly name: string;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{ status: ShipmentStatus; lastUpdate?: string }>;
}
