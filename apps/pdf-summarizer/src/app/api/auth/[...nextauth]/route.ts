import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

/**
 * NextAuth App Router handler — catches all /api/auth/* requests.
 * Exports both GET and POST to satisfy the App Router requirement.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
