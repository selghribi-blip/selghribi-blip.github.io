/**
 * NextAuth v5 configuration with Google & GitHub OAuth providers.
 * Uses the Prisma adapter to persist users and sessions.
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "./db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    // Attach plan and id to the session so API routes can read them.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.plan = (user as { plan?: string }).plan ?? "free";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
});
