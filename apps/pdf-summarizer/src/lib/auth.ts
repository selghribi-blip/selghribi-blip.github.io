import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';

// Augment the NextAuth session type to include user.id and subscriptionStatus
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscriptionStatus?: string | null;
    } & DefaultSession['user'];
  }
}

/**
 * NextAuth configuration.
 * Providers: GitHub OAuth (optional) and Email magic link (optional).
 * Session callback injects user.id and subscription status into the session.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // GitHub OAuth — only enabled when credentials are present
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // Email magic link — only enabled when SMTP credentials are present
    ...(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST,
              port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
              auth: {
                user: process.env.EMAIL_SERVER_USER ?? '',
                pass: process.env.EMAIL_SERVER_PASSWORD ?? '',
              },
            },
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    /**
     * Adds user.id and the current subscription status to the session object
     * so client components can use them without extra DB calls.
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch subscription status and attach it to the session
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
          select: { status: true },
        });
        session.user.subscriptionStatus = subscription?.status ?? 'INACTIVE';
      }
      return session;
    },
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
};

/**
 * Convenience wrapper around getServerSession that injects authOptions automatically.
 * Use this in Server Components and API routes.
 */
export async function getServerAuthSession() {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
