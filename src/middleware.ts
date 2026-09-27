import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!session?.user || session.user.role !== "ADMIN") {
        const url = new URL("/admin/login", req.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
