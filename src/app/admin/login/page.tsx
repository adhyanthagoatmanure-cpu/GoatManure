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
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      setServerError("Incorrect email or password.");
      return;
    }
    const session = await getSession();
    if (session?.user.role !== "ADMIN") {
      setServerError("This account does not have admin access.");
      return;
    }
    router.push(from);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canopy-dark)] px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          <span className="relative h-14 w-14 overflow-hidden rounded-full">
            <Image src="/images/brand/logo-mark-64.png" alt="ADHYANTHA" fill className="object-cover" />
          </span>
          <h1 className="mt-4 flex items-center gap-2 font-display text-xl font-medium">
            <ShieldCheck className="h-5 w-5 text-[var(--color-canopy)]" /> Admin Console
          </h1>
          <p className="mt-1 text-center text-sm text-[var(--color-stone)]">Sign in to manage ADHYANTHA</p>
        </div>

        {serverError && (
          <p className="mt-5 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          <Button type="submit" size="lg" className="mt-1" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
