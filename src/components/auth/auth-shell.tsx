"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Leaf } from "lucide-react";

const benefits = ["100% Organic", "Better Soil Health", "Sustainable Farming"];

/*
  Shared frame for login / signup / password pages.

  Desktop: a photo panel (brand message on a dark gradient — white text, measured ≥ 7:1) beside the
  form panel. The form panel is left transparent so the page's soft colour field shows through the
  frosted card. Mobile: the photo panel is dropped and the logo + tagline sit above the card.

  The element is a <div>, not <main>: SiteChrome already provides the page's single <main> landmark.
*/
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant = "login",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "login" | "signup";
}) {
  const image = variant === "login" ? "/images/02_hands_with_soil_seedling.jpg" : "/images/07_organic_farming_seedling.jpg";
  const isLogin = variant === "login";

  const visualPanel = (
    <section
      data-on-dark
      className="relative isolate hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-10 xl:p-14"
    >
      <Image src={image} alt="" fill sizes="50vw" className="-z-20 object-cover" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(165deg,rgba(28,51,20,0.84)_0%,rgba(28,51,20,0.66)_45%,rgba(28,51,20,0.9)_100%)]"
      />
      <div>
        <Link href="/" aria-label="ADHYANTHA home" className="glass-strong inline-block rounded-[var(--radius-md)] p-3">
          <Image src="/images/brand/logo-lockup.png" alt="ADHYANTHA Goat Manure" width={380} height={120} className="h-auto w-52 object-contain" priority />
        </Link>
        <div className="mt-10 max-w-md">
          <Leaf className="h-8 w-8 text-sage-deep" aria-hidden />
          <p className="mt-4 font-display text-2xl italic text-gold">Healthy Soil | Green Future</p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-white">
            {isLogin ? (
              <>
                Grow better,
                <span className="block italic text-sage-deep">naturally.</span>
              </>
            ) : (
              "Join a greener tomorrow."
            )}
          </h2>
          <p className="mt-4 max-w-sm text-base leading-7 text-white/90">
            {isLogin
              ? "Natural nourishment for your soil, plants, and every harvest."
              : "Be part of a community choosing healthier soil and sustainable farming."}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="glass-dark flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-gold" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  );

  const formPanel = (
    <section className="flex w-full items-center justify-center bg-[radial-gradient(36rem_26rem_at_88%_0%,rgba(201,162,39,0.14),transparent_62%),radial-gradient(34rem_26rem_at_0%_100%,rgba(74,124,46,0.16),transparent_62%)] px-4 py-10 sm:px-8 lg:w-1/2 lg:px-12">
      <div className="w-full max-w-[500px]">
        <div className="mb-5 flex justify-center lg:hidden">
          <Link href="/" aria-label="ADHYANTHA home" className="glass-strong rounded-[var(--radius-md)] p-3">
            <Image src="/images/brand/logo-lockup.png" alt="ADHYANTHA Goat Manure" width={380} height={120} className="h-auto w-52 object-contain" priority />
          </Link>
        </div>
        <div className="glass-strong rounded-[var(--radius-xl)] p-6 sm:p-9">
          <div className="mb-6 text-center">
            <p className="font-display text-lg italic text-leaf lg:hidden">Healthy Soil | Green Future</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{title}</h1>
            {subtitle && <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-stone">{footer}</div>}
        </div>
      </div>
    </section>
  );

  // `-mb-24` cancels the footer's top margin so the photo panel meets the footer without a blank band.
  return (
    <div className="-mb-24 flex min-h-[calc(100svh-5rem)] w-full flex-col lg:flex-row">
      {visualPanel}
      {formPanel}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-border-strong" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone">or</span>
      <span className="h-px flex-1 bg-border-strong" />
    </div>
  );
}
