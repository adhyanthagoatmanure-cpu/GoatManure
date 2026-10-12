"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function useSignOut(redirectTo: string) {
  const router = useRouter();

  return async function signOutAndNavigate() {
    try {
      await signOut({ redirect: false, redirectTo });
      router.replace(redirectTo);
    } catch (error) {
      console.error("Unable to sign out.", error);
    }
  };
}
