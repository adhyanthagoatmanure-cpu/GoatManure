"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-canopy)] px-4 py-2 text-sm font-semibold text-white"
    >
      <Printer className="h-4 w-4" /> Print A4 Sheet
    </button>
  );
}
