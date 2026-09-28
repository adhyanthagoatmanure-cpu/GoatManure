import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import baseAuthConfig from "@/lib/auth.config";
import { ADMIN_EMAIL } from "@/lib/admin-identity";

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasFacebook = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);

const authConfig: NextAuthConfig = {
  ...baseAuthConfig,
  // The adapter persists OAuth users/accounts/sessions. Credentials sign-in
  // is handled manually in `authorize()` below and does not go through the
  // adapter — that's a hard NextAuth v4 constraint, which is why the whole
  // config runs on JWT sessions rather than database sessions.
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!user || !user.passwordHash) return null;
        if (user.status === "SUSPENDED") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, phone: user.phone };
      },
    }),
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(hasFacebook
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: "email,public_profile",
                auth_type: "rerequest",
              },
            },
            userinfo: {
              url: "https://graph.facebook.com/me?fields=id,name,email,picture",
            },
            profile(profile) {
              return {
                id: profile.id,
                name: profile.name,
                email: typeof profile.email === "string" ? profile.email.trim().toLowerCase() : undefined,
                image: profile.picture?.data?.url ?? null,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    /**
     * Account linking: if someone signs in with Google/Facebook using an
     * email that already belongs to an existing account (e.g. they first
     * signed up with a password), we only auto-link when the provider
     * vouches the email is verified — Google sets `email_verified` on the
     * profile, and Facebook only ever returns an email it has itself
     * verified. This mirrors Auth.js's documented manual-linking pattern:
     * without this, NextAuth intentionally refuses to link and shows
     * "OAuthAccountNotLinked" rather than silently merging accounts, which
     * is the safer default but a poor experience for a legitimate owner.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      if (
        account.provider === "facebook" &&
        (typeof profile?.email !== "string" || !profile.email.trim() || !user.email)
      ) {
        return "/login?error=FacebookEmailMissing";
      }

      const emailVerified =
        account.provider === "google"
          ? Boolean((profile as { email_verified?: boolean } | undefined)?.email_verified)
          : account.provider === "facebook"
            ? Boolean(user.email)
            : false;

      if (!user.email || !emailVerified) return true; // let the adapter's default flow handle it

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (existingUser) {
        const alreadyLinked = existingUser.accounts.some((a) => a.provider === account.provider);
        if (!alreadyLinked) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "CUSTOMER" | "ADMIN" }).role ?? "CUSTOMER";
      }
      const dbUser = token.id
        ? await prisma.user.findUnique({ where: { id: token.id as string } })
        : token.email
          ? await prisma.user.findUnique({ where: { email: token.email as string } })
          : null;
      if (dbUser) {
        const role = dbUser.email === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER";
        if (dbUser.role !== role) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role },
          });
        }
        token.id = dbUser.id;
        token.role = role;
        token.phone = dbUser.phone;
        token.image = dbUser.image;
        token.needsProfileCompletion = account?.provider === "google"
          ? !dbUser.phone
          : token.needsProfileCompletion === true && !dbUser.phone;
      } else {
        token.role = "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
        session.user.phone = token.phone as string | null | undefined;
        session.user.image = token.image as string | null | undefined;
        session.user.needsProfileCompletion = token.needsProfileCompletion as boolean | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const oauthProvidersAvailable = { google: hasGoogle, facebook: hasFacebook };

export const { handlers, auth } = NextAuth(authConfig);
