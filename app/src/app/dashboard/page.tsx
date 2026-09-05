import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserPlan, PLANS } from '@/lib/subscription';
import { checkRateLimit } from '@/lib/rateLimit';
import { SummarizerClient } from './SummarizerClient';

export const metadata = {
  title: 'Dashboard — PDF & Contract Summarizer',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const planName = await getUserPlan();
  const plan = PLANS[planName];
  const userId = (session.user as { id?: string }).id ?? session.user.email ?? '';

  const usage =
    planName === 'FREE' ? checkRateLimit(userId, plan.dailyLimit) : null;

  return (
    <div>
      {/* User info & plan badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              planName === 'PRO'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {planName === 'PRO' ? '⭐ Pro' : 'Free'} Plan
          </span>
          {planName === 'FREE' && (
            <a
              href="/pricing"
              className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      </div>

      {/* Usage indicator for Free users */}
      {planName === 'FREE' && usage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Daily usage: {usage.used} / {usage.limit} summaries
            </span>
            {usage.used >= usage.limit && (
              <a href="/pricing" className="text-xs text-blue-600 underline font-medium">
                Upgrade for unlimited
              </a>
            )}
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
            />
          </div>
          {usage.used >= usage.limit && (
            <p className="text-xs text-blue-700 mt-2">
              You&apos;ve reached your daily limit. Resets at midnight UTC.{' '}
              <a href="/pricing" className="underline font-medium">
                Upgrade to Pro
              </a>{' '}
              for unlimited summaries.
            </p>
          )}
        </div>
      )}

      <SummarizerClient planName={planName} canUseContractMode={plan.contractMode} />
    </div>
  );
}
