"use client";

import { signOut } from "next-auth/react";
import { useToast } from "@/components/providers/toast-provider";

export function useSignOut(redirectTo: string) {
  const { show } = useToast();

  return async function signOutAndNavigate() {
    try {
      const result = await signOut({ redirect: false, redirectTo });
      window.location.assign(result?.url ?? redirectTo);
    } catch {
      console.error("Unable to sign out.");
      show("Unable to sign out. Please try again.", "error");
    }
  };
}
