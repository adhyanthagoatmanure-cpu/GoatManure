"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema) });

  async function onSubmit(values: AdminLoginInput) {
    setServerError(null);
    const res = await signIn("credentials", { ...values, redirect: false, redirectTo: from });
    if (!res?.ok || res.error) {
      setServerError("Incorrect email or password.");
      return;
    }
    const session = await getSession();
    if (session?.user.role !== "ADMIN") {
      setServerError("This account does not have admin access.");
      return;
    }
    router.replace(from);
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft photo + forest gradient behind the frosted card (decorative only) */}
      <Image
        src="/images/02_hands_with_soil_seedling.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
        priority
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(28,51,20,0.92)_0%,rgba(28,51,20,0.8)_50%,rgba(20,38,14,0.94)_100%)]"
      />

      <div className="glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-7 sm:p-9">
        <div className="flex flex-col items-center">
          <span className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/80 shadow-[var(--shadow-soft)]">
            <Image src="/images/brand/logo-mark-64.png" alt="ADHYANTHA" fill sizes="64px" className="object-cover" />
          </span>
          <h1 className="mt-5 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
            <ShieldCheck className="h-6 w-6 text-leaf" aria-hidden /> Admin Console
          </h1>
          <p className="mt-1.5 text-center text-sm text-stone">Sign in to manage ADHYANTHA</p>
        </div>

        {serverError && (
          <p
            role="alert"
            className="mt-5 rounded-[var(--radius-sm)] border border-error/25 bg-error-bg px-3.5 py-2.5 text-sm font-medium text-error"
          >
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
