"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { WhatsAppOtpLogin } from "@/components/auth/whatsapp-otp-login";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const NEXTAUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password. Please try again.",
  OAuthAccountNotLinked:
    "This email is already registered with a different sign-in method. Try logging in with your password, or use the original method.",
  OAuthSignin: "Something went wrong starting the sign-in. Please try again.",
  OAuthCallback: "Sign-in was cancelled or failed. Please try again.",
  Callback: "Sign-in was cancelled or failed. Please try again.",
  FacebookEmailMissing:
    "Facebook did not provide an email address. Please allow email access in Facebook and try again, or use another sign-in method.",
  Default: "Something went wrong signing you in. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const oauthError = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(
    oauthError ? NEXTAUTH_ERROR_MESSAGES[oauthError] ?? NEXTAUTH_ERROR_MESSAGES.Default : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === "authenticated" && !isSubmitting) {
      const destination = session?.user.needsProfileCompletion
        ? `/complete-profile?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : callbackUrl;
      router.replace(destination);
    }
  }, [callbackUrl, isSubmitting, router, session?.user.needsProfileCompletion, status]);

  if (status === "authenticated") return null;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const res = await signIn("credentials", { ...values, redirect: false, redirectTo: callbackUrl });
      if (!res?.ok || res.error) {
        setServerError(NEXTAUTH_ERROR_MESSAGES.CredentialsSignin);
        return;
      }

      await update();
      window.location.assign(res.url ?? callbackUrl);
    } catch {
      setServerError(NEXTAUTH_ERROR_MESSAGES.Default);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle={"Login to your account and continue your green journey."}
      variant="login"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--color-canopy)] hover:underline">
            Sign Up
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
        <Input label="Email or Username" type="email" {...register("email")} error={errors.email?.message} />
        <div>
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          <div className="mt-3 flex items-center justify-between gap-3 text-xs"><label className="flex items-center gap-2 text-[#718177]"><input type="checkbox" className="h-4 w-4 rounded border-[#c9d8c5] accent-[#4f9c42]" /> Remember me</label><Link href="/forgot-password" className="font-medium text-[#4f9c42] hover:underline">Forgot password?</Link></div>
        </div>
        <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
          <LogIn className="h-4 w-4" /> Login
        </Button>
      </form>
      <OrDivider />
      <WhatsAppOtpLogin callbackUrl={callbackUrl} />
      <OrDivider />
      <SocialLoginButtons callbackUrl={callbackUrl} />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
