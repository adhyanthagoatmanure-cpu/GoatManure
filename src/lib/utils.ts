import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format whole-rupee integers the way the storefront always displays money: ₹149, ₹1,299 — no decimals, since the catalog never prices in paise. */
export function formatINR(amountInRupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInRupees);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Human order number the customer sees, e.g. ADYA100482. Not the DB id. */
export function formatOrderNumber(value: string): string {
  return value.replace(/-/g, "").toUpperCase();
}

export function generateOrderNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 899999);
  return formatOrderNumber(`ADY-${rand}`);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((image): image is string => typeof image === "string" && image.trim().length > 0);
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}
