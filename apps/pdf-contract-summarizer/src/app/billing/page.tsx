import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BillingCard from "@/components/BillingCard";

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Billing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your subscription</p>
        </div>

        {params.success && (
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 p-4 text-sm">
            🎉 You&apos;re now on Pro! Enjoy unlimited summaries and contract mode.
          </div>
        )}
        {params.canceled && (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 text-sm">
            Checkout was canceled. You are still on the free plan.
          </div>
        )}

        <BillingCard
          plan={user?.plan ?? "free"}
          subscriptionStatus={user?.subscriptionStatus ?? null}
          currentPeriodEnd={user?.currentPeriodEnd?.toISOString() ?? null}
          hasCustomerId={!!user?.stripeCustomerId}
        />

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h2 className="font-bold text-white mb-4">Plan comparison</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-slate-300 mb-2">Free</p>
              <ul className="space-y-1 text-slate-400">
                <li>✅ 3 summaries/day</li>
                <li>✅ Up to 5 MB PDFs</li>
                <li>✅ PDF summary mode</li>
                <li>❌ Contract mode</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-teal-400 mb-2">Pro ⭐</p>
              <ul className="space-y-1 text-slate-400">
                <li>✅ Unlimited summaries</li>
                <li>✅ Up to 20 MB PDFs</li>
                <li>✅ PDF summary mode</li>
                <li>✅ Contract mode</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
