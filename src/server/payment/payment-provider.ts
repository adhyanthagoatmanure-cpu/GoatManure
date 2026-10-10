/**
 * Legacy payment gateway abstraction used by the Razorpay-specific API routes.
 * Storefront checkout currently uses PayU Hosted Checkout through
 * `payu-provider.ts`.
 *
 * Amounts must be computed server-side from database prices, and payment
 * status must not be marked PAID until a gateway signature has been verified.
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
