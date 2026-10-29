"use client";

import { signOut } from "next-auth/react";
import { useToast } from "@/components/providers/toast-provider";

export function useSignOut(redirectTo: string) {
  const { show } = useToast();

  return async function signOutAndNavigate() {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Unable to finish the sign-out request cleanly.", error);
      show("Refreshing the sign-out page.");
    } finally {
      window.location.replace(new URL(redirectTo, window.location.origin).href);
    }
  };
}
