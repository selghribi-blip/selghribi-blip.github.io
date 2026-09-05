import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkQuota, asPlan } from "@/lib/limits";
import { SummarizePageClient } from "./SummarizePageClient";

export default async function SummarizePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user) return null;

  const plan = asPlan(user.plan);
  const quotaResult = await checkQuota(session.user.id, plan, false);
  const quota = quotaResult.allowed
    ? quotaResult
    : {
        plan,
        used: 0,
        included: plan === "FREE" ? 3 : 200,
        remaining: 0,
        isOverage: false,
      };

  return <SummarizePageClient plan={plan} initialQuota={quota} />;
}
