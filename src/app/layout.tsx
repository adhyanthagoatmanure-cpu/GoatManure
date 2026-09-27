import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
  },
  description:
    "100% organic goat manure fertilizer for a healthier garden and soil. Nutrient-rich, natural plant nutrition, sustainably packed and delivered across India.",
  icons: {
    icon: "/images/brand/logo-mark-32.png",
    apple: "/images/brand/logo-mark-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <SiteChrome>{children}</SiteChrome>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
