import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotaInfo } from "@/lib/stripe/billing";

/**
 * GET /api/quota
 * Returns current quota usage for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const quota = await getQuotaInfo(session.user.id);
  return NextResponse.json(quota);
}
