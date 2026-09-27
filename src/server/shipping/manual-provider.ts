import type {
  ShippingProvider,
  CreateShipmentInput,
  CreateShipmentResult,
} from "./shipping-provider";

/**
 * Default provider: the admin enters the AWB number themselves after booking
 * on the courier's own portal (Shiprocket, Delhivery, India Post, a local
 * courier, etc). This keeps the platform courier-agnostic from day one.
 */
class ManualShippingProvider implements ShippingProvider {
  readonly name = "manual";

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    return {
      trackingNumber: "",
      provider: input.provider || "Manual",
      status: "READY_TO_SHIP",
    };
  }

  async trackShipment(): Promise<{ status: "IN_TRANSIT" }> {
    return { status: "IN_TRANSIT" };
  }
}

let instance: ShippingProvider | null = null;

export function getShippingProvider(): ShippingProvider {
  if (!instance) instance = new ManualShippingProvider();
  return instance;
}
