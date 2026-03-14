import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkQuota, asPlan } from "@/lib/limits";

/**
 * GET /api/quota
 *
 * Returns the current user's quota status for the UI.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const quota = await checkQuota(userId, asPlan(user.plan), false);
  return NextResponse.json({ quota });
}
