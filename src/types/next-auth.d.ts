import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN";
      phone?: string | null;
      needsProfileCompletion?: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "CUSTOMER" | "ADMIN";
    phone?: string | null;
    needsProfileCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CUSTOMER" | "ADMIN";
    phone?: string | null;
    needsProfileCompletion?: boolean;
  }
}
