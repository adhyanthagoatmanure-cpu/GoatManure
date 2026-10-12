import { z } from "zod";

export const INVALID_INDIAN_MOBILE_NUMBER =
  "Enter a valid 10-digit Indian mobile number";

export function normalizeIndianMobileNumber(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 11 && trimmed.startsWith("0")
    ? trimmed.slice(1)
    : trimmed;
}

export const indianMobileNumberSchema = z
  .string({ error: INVALID_INDIAN_MOBILE_NUMBER })
  .transform(normalizeIndianMobileNumber)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, INVALID_INDIAN_MOBILE_NUMBER));
