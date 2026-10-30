export const ADMIN_EMAIL = "adhyanthagoatmanure@gmail.com";
export const ADMIN_PHONE = "9585420222";

export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function roleForIdentity(
  email: string | null | undefined,
  _emailVerified: Date | null | undefined,
  _storedRole: string | null | undefined,
): "CUSTOMER" | "ADMIN" {
  return isConfiguredAdminEmail(email) ? "ADMIN" : "CUSTOMER";
}

export function isAdminIdentity(
  email: string | null | undefined,
  _role: string | null | undefined,
): boolean {
  return isConfiguredAdminEmail(email);
}
