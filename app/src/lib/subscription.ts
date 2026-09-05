import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { stripe, PLANS, type PlanName } from './stripe';

/**
 * Returns the Stripe subscription status for the signed-in user.
 * Falls back to FREE if the user has no active subscription.
 */
export async function getUserPlan(): Promise<PlanName> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return 'FREE';

  try {
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) return 'FREE';

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) return 'FREE';

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id;

    if (priceId === PLANS.PRO.stripePriceId) return 'PRO';

    return 'FREE';
  } catch {
    // Fail open on Stripe errors: default to FREE
    return 'FREE';
  }
}

export { PLANS };
