import { z } from "zod";

export const INVALID_INDIAN_MOBILE_NUMBER =
  "Enter a valid 10-digit Indian mobile number";

export function normalizeIndianMobileNumber(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact.slice(3);
  if (/^91[6-9]\d{9}$/.test(compact)) return compact.slice(2);
  if (/^0[6-9]\d{9}$/.test(compact)) return compact.slice(1);
  return compact;
}

export const indianMobileNumberSchema = z
  .string({ error: INVALID_INDIAN_MOBILE_NUMBER })
  .transform(normalizeIndianMobileNumber)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, INVALID_INDIAN_MOBILE_NUMBER));
