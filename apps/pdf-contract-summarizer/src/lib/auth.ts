/**
 * lib/auth.ts
 * NextAuth configuration with Google and GitHub providers.
 * Uses the Prisma adapter so users/sessions are persisted in the DB.
 */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Expose plan and userId to the client session
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, plan: true, subscriptionStatus: true },
        });
        if (dbUser) {
          (session.user as typeof session.user & { id: string; plan: string }).id = dbUser.id;
          (session.user as typeof session.user & { plan: string }).plan = dbUser.plan;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
};
