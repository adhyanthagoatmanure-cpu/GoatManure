import type { CartLine } from "@/types";

export function pruneUnavailableCartLines(
  lines: CartLine[],
  unavailableVariantIds: string[],
): CartLine[] {
  if (unavailableVariantIds.length === 0) return lines;
  const unavailable = new Set(unavailableVariantIds);
  return lines.filter((line) => !unavailable.has(line.variantId));
}
