"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong creating your account.");
      return;
    }
    const signInRes = await signIn("credentials", {
      email: values.email,
      phone: values.phone,
      password: values.password,
      redirect: false,
    });
    if (signInRes?.ok) {
      router.push("/account");
      router.refresh();
    } else {
      router.push("/login");
    }
  }

  return (
    <AuthShell
      title="Create Your Account"
      subtitle="Join Adhyantha Goat Manure and be a part of a greener tomorrow."
      variant="signup"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-canopy)] hover:underline">
            Log In
          </Link>
        </>
      }
    >
      {serverError && (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Full Name" {...register("name")} error={errors.name?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone Number" type="tel" {...register("phone")} error={errors.phone?.message} />
        <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
        <Input label="Confirm Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />

        <label className="flex items-start gap-2.5 text-sm text-[var(--color-stone)]">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)]" {...register("agreeToTerms")} />
          <span>I agree to the <Link href="/terms" className="font-medium text-[#4f9c42] hover:underline">Terms &amp; Conditions</Link> and <Link href="/privacy-policy" className="font-medium text-[#4f9c42] hover:underline">Privacy Policy</Link>.</span>
        </label>
        {errors.agreeToTerms && <p className="text-xs text-[var(--color-error)]">{errors.agreeToTerms.message}</p>}

        <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
          <UserPlus className="h-4 w-4" /> Create Account
        </Button>
      </form>
      <OrDivider />
      <SocialLoginButtons callbackUrl="/account" />
    </AuthShell>
  );
}
