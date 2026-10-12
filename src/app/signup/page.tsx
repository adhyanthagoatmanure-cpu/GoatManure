"use client";

import { useEffect, useState } from "react";
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
import { MessageCircle, RotateCw, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (!resendAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setResendAt(null);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  async function sendCode(values: SignupInput) {
    setServerError(null);
    setStatusMessage(null);
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/whatsapp-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "REGISTER", registration: values }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(data?.error ?? "Unable to request a verification code.");
        return;
      }
      setChallengeId(data.challengeId);
      setStatusMessage(data.message ?? "If eligible, a verification code may be sent. If you do not receive one, wait for the resend timer and try again.");
      setResendAt(Date.now() + 60_000);
    } catch {
      setServerError("Unable to request a verification code. Please check your connection.");
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(values: SignupInput) {
    await sendCode(values);
  }

  async function verifyCode() {
    if (!challengeId) return;
    setServerError(null);
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/whatsapp-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "REGISTER", challengeId, code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setServerError(data?.error ?? "The code is invalid or expired. Request a new code.");
        return;
      }

      const values = getValues();
      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        redirectTo: "/account",
      });
      if (signInResult?.ok && !signInResult.error) {
        router.replace("/account");
        router.refresh();
      } else {
        router.replace("/login");
        router.refresh();
      }
    } catch {
      setServerError("Unable to verify the code. Please try again.");
    } finally {
      setIsVerifying(false);
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
        <fieldset disabled={Boolean(challengeId)} className="flex flex-col gap-4 disabled:opacity-70">
          <Input label="Full Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
          <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          <Input label="Phone Number" type="tel" inputMode="numeric" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
          <Input label="Password" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} />
          <Input label="Confirm Password" type="password" autoComplete="new-password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />

          <label className="flex items-start gap-2.5 text-sm text-[var(--color-stone)]">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)]" {...register("agreeToTerms")} />
            <span>I agree to the <Link href="/terms" className="font-medium text-[#4f9c42] hover:underline">Terms &amp; Conditions</Link> and <Link href="/privacy-policy" className="font-medium text-[#4f9c42] hover:underline">Privacy Policy</Link>.</span>
          </label>
          {errors.agreeToTerms && <p className="text-xs text-[var(--color-error)]">{errors.agreeToTerms.message}</p>}
          {!challengeId && (
            <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting || isSending}>
              <MessageCircle className="h-4 w-4" /> Send WhatsApp Verification Code
            </Button>
          )}
        </fieldset>
      </form>
      {challengeId && (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="6-digit WhatsApp verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            error={serverError ?? undefined}
          />
          {statusMessage && <p role="status" className="text-sm text-[var(--color-stone)]">{statusMessage}</p>}
          <Button type="button" size="lg" onClick={verifyCode} isLoading={isVerifying} disabled={code.length !== 6}>
            <UserPlus className="h-4 w-4" /> Verify and Create Account
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => sendCode(getValues())}
            isLoading={isSending}
            disabled={secondsLeft > 0}
          >
            <RotateCw className="h-4 w-4" />
            {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
          </Button>
          <button
            type="button"
            className="text-sm text-[var(--color-canopy)] hover:underline"
            onClick={() => {
              setChallengeId(null);
              setCode("");
              setStatusMessage(null);
              setServerError(null);
            }}
          >
            Change registration details
          </button>
        </div>
      )}
      <OrDivider />
      <SocialLoginButtons callbackUrl="/account" />
    </AuthShell>
  );
}
