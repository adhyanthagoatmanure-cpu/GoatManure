export function normalizeWhatsAppPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const compact = value.trim().replace(/[\s\-()]/g, "");
  if (!compact) return null;

  if (compact.startsWith("+")) {
    const digits = compact.slice(1);
    if (!/^\d+$/.test(digits) || digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (!/^\d+$/.test(compact)) return null;
  if (/^0[6-9]\d{9}$/.test(compact)) return `+91${compact.slice(1)}`;
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  if (/^91[6-9]\d{9}$/.test(compact)) return `+${compact}`;

  return null;
}
