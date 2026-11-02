"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printAfterImagesLoaded } from "@/lib/print";

export function PrintButton() {
  return (
    <Button type="button" onClick={printAfterImagesLoaded}>
      <Printer className="h-4 w-4" aria-hidden /> Print A4 Sheet
    </Button>
  );
}
