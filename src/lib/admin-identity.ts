export const ADMIN_EMAIL = "adhyanthagoatmanure@gmail.com";

export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function roleForIdentity(
  email: string | null | undefined,
  emailVerified: Date | null | undefined,
  storedRole: string | null | undefined,
): "CUSTOMER" | "ADMIN" {
  return isConfiguredAdminEmail(email) && emailVerified && storedRole === "ADMIN"
    ? "ADMIN"
    : "CUSTOMER";
}

export function isAdminIdentity(
  email: string | null | undefined,
  role: string | null | undefined,
): boolean {
  return isConfiguredAdminEmail(email) && role === "ADMIN";
}
