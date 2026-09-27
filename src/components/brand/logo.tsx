import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The header logo uses the real mark from the client's ZIP. The source PNG
 * has an opaque cream backing (not transparent), which matches the header's
 * parchment background — but would show a mismatched box on a dark surface,
 * so dark contexts (e.g. the footer) use `variant="chip"` to contain it in a
 * small rounded card instead. A transparent/SVG export from the client would
 * let this go edge-to-edge everywhere; see the README.
 */
export function Logo({
  className,
  variant = "default",
  showWordmark = true,
}: {
  className?: string;
  variant?: "default" | "chip";
  showWordmark?: boolean;
}) {
  const useLockup = variant === "default" && showWordmark;

  return (
    <Link href="/" className={cn("flex shrink-0 items-center", className)} aria-label="ADHYANTHA home">
      {useLockup ? (
        <Image
          src="/images/brand/logo-lockup.png"
          alt="ADHYANTHA Goat Manure"
          width={2200}
          height={700}
          sizes="(min-width: 640px) 220px, 180px"
          className="h-auto w-[180px] object-contain sm:w-[220px]"
          priority
        />
      ) : (
        <span
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-11 sm:w-11",
            variant === "chip" && "bg-[var(--color-parchment)] p-0.5"
          )}
        >
          <Image src="/images/brand/logo-mark-64.png" alt="" fill sizes="44px" className="object-cover" priority />
        </span>
      )}
    </Link>
  );
}
