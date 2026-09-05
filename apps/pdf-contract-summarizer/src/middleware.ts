/**
 * middleware.ts
 * Protects /dashboard and /api/stripe/** from unauthenticated access.
 * /api/stripe/webhook is excluded so Stripe can call it without a session.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/stripe/checkout", "/api/stripe/portal"],
};
