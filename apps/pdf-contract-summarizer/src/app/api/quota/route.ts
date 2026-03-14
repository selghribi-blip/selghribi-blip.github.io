/**
 * GET /api/quota
 *
 * Returns the current quota status for the authenticated user.
 *
 * Response:
 *   200 { quota: QuotaStatus }
 *   401 { error }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = session.user.id;
  const plan = (session.user.plan ?? "free") as "free" | "pro";

  const quota = await getQuotaStatus(userId, plan);

  return NextResponse.json({ quota });
}
