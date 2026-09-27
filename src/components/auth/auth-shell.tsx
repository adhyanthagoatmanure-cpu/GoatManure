"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Leaf } from "lucide-react";

const benefits = ["100% Organic", "Better Soil Health", "Sustainable Farming"];

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
      className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-10"
      style={{ backgroundImage: `url("${image}")`, backgroundPosition: "center", backgroundSize: "cover" }}
    >
      <div className="absolute inset-0 bg-[#0b3d27]/65" />
      <div className="relative z-10">
        <Link href="/" aria-label="ADHYANTHA home" className="inline-block rounded-xl bg-white/95 p-3">
          <Image src="/images/brand/logo-lockup.png" alt="ADHYANTHA Goat Manure" width={380} height={120} className="h-auto w-52 object-contain" priority />
        </Link>
        <div className="mt-10 max-w-md text-white">
          <Leaf className="h-8 w-8 text-[#bce99f]" />
          <p className="mt-4 font-[cursive] text-2xl text-[#d8f0c6]">Healthy Soil | Green Future</p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.05]">{isLogin ? "Grow better, naturally." : "Join a greener tomorrow."}</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">{isLogin ? "Natural nourishment for your soil, plants, and every harvest." : "Be part of a community choosing healthier soil and sustainable farming."}</p>
        </div>
      </div>
      <div className="relative z-10 flex flex-wrap gap-3">
        {benefits.map((benefit) => <span key={benefit} className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-sm"><CheckCircle2 className="h-4 w-4 text-[#bce99f]" />{benefit}</span>)}
      </div>
    </section>
  );

  const formPanel = (
    <section className="flex min-h-screen w-full items-center justify-center bg-[#f7f9f3] px-4 py-8 sm:px-8 lg:w-1/2 lg:px-12">
      <div className="w-full max-w-[500px]">
        <div className="mb-5 flex justify-center lg:hidden">
          <Link href="/" aria-label="ADHYANTHA home" className="rounded-xl bg-white p-3 shadow-sm"><Image src="/images/brand/logo-lockup.png" alt="ADHYANTHA Goat Manure" width={380} height={120} className="h-auto w-52 object-contain" priority /></Link>
        </div>
        <div className="rounded-3xl border border-[#e1e9df] bg-white p-6 shadow-[0_16px_45px_rgba(20,67,43,0.1)] sm:p-9">
          <div className="mb-6 text-center">
            <p className="font-[cursive] text-base text-[#4f9c42] lg:hidden">Healthy Soil | Green Future</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[#173d2b]">{title}</h1>
            {subtitle && <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-[#718177]">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-[#718177]">{footer}</div>}
        </div>
      </div>
    </section>
  );

  return <main className="flex min-h-screen w-full flex-col lg:flex-row">{isLogin ? <>{visualPanel}{formPanel}</> : <>{formPanel}{visualPanel}</>}</main>;
}

export function OrDivider() {
  return <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#e1e9df]" /><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa69c]">or</span><span className="h-px flex-1 bg-[#e1e9df]" /></div>;
}
