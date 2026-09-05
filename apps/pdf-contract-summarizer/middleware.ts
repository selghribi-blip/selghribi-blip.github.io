import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/summarize"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect routes that need authentication.
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !req.auth) {
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
