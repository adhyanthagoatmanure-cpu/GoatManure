/**
 * Payment gateway abstraction.
 *
 * Order/checkout logic depends only on this interface, never on a specific
 * gateway SDK. Today only Razorpay is implemented (the most common gateway
 * for Indian D2C businesses — supports UPI, cards, netbanking, wallets), but
 * a second provider (e.g. Cashfree, PayU) can be added by implementing this
 * interface and swapping it in `getPaymentProvider()` below.
 *
 * Hard rule enforced by this whole layer: the amount charged is ALWAYS
 * computed server-side from the database (see order-pricing.service.ts) and
 * a payment is never marked PAID without a verified signature from the
 * gateway. The frontend cannot cause money to move or an order to be marked
 * paid by sending values directly.
 */

export interface CreateGatewayOrderInput {
  orderId: string;
  amountInRupees: number;
  receipt: string;
}

export interface CreateGatewayOrderResult {
  gatewayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  createOrder(input: CreateGatewayOrderInput): Promise<CreateGatewayOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
}
