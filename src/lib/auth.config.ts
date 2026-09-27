import type { NextAuthConfig } from "next-auth";

const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/account",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "CUSTOMER" | "ADMIN" | undefined) ?? "CUSTOMER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;
