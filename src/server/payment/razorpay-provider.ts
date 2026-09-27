import Razorpay from "razorpay";
import crypto from "crypto";
import type {
  PaymentProvider,
  CreateGatewayOrderInput,
  CreateGatewayOrderResult,
  VerifyPaymentInput,
} from "./payment-provider";

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  readonly isConfigured = Boolean(KEY_ID && KEY_SECRET);

  private client(): Razorpay {
    if (!this.isConfigured) {
      throw new Error(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payments."
      );
    }
    return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }

  async createOrder(input: CreateGatewayOrderInput): Promise<CreateGatewayOrderResult> {
    const amountInPaise = Math.round(input.amountInRupees * 100);
    if (amountInPaise < 100) {
      throw new Error("Razorpay orders must be at least 100 paise");
    }

    const order = await this.client().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: { orderId: input.orderId },
    });
    return {
      gatewayOrderId: order.id,
      amountInPaise,
      currency: "INR",
      keyId: KEY_ID,
    };
  }

  /**
   * Razorpay's checkout widget returns order id, payment id, and an HMAC
   * signature to the browser. That signature is the ONLY thing that proves
   * the payment is genuine — we recompute it server-side with the secret key
   * (never sent to the browser) and compare. A mismatch means the payment is
   * not verified and the order must NOT be marked paid.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    if (!this.isConfigured) return false;
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
      .digest("hex");

    const received = Buffer.from(input.gatewaySignature);
    const expectedBuffer = Buffer.from(expected);
    return received.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, received);
  }
}

let instance: PaymentProvider | null = null;

/** Swap the provider here if a second gateway is added later. */
export function getPaymentProvider(): PaymentProvider {
  if (!instance) instance = new RazorpayProvider();
  return instance;
}
