export const ADMIN_EMAIL = "adhyanthagoatmanure@gmail.com";

export function isAdminIdentity(
  email: string | null | undefined,
  role: string | null | undefined,
): boolean {
  return email === ADMIN_EMAIL && role === "ADMIN";
}
