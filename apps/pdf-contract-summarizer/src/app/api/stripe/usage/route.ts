// POST /api/stripe/usage
// Reports one metered usage unit for the Pro overage price.
// Called after each summary request that exceeds the 200 included/month.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      summaryCount: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user || user.plan !== "pro" || !user.stripeSubscriptionId) {
    // Only Pro users with an active subscription can incur overage.
    return NextResponse.json({ reported: false });
  }

  // Only report usage when the user is beyond the included 200 summaries.
  if (user.summaryCount <= PLANS.pro.includedSummaries) {
    return NextResponse.json({ reported: false });
  }

  // Retrieve the subscription to find the metered subscription item ID.
  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId
  );

  const meteredItem = subscription.items.data.find(
    (item) => item.price.id === PLANS.pro.stripePriceIdOverageMetered
  );

  if (!meteredItem) {
    return NextResponse.json(
      { error: "Metered subscription item not found" },
      { status: 500 }
    );
  }

  // Report 1 unit of usage for this summary request.
  // Stripe sums all records within the billing period (aggregation: sum).
  await stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
    quantity: 1,
    timestamp: Math.floor(Date.now() / 1000),
    action: "increment",
  });

  return NextResponse.json({ reported: true });
}
