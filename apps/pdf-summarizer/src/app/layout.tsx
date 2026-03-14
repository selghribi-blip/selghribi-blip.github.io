'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import './globals.css';

/**
 * Root layout — wraps all pages in SessionProvider (required for useSession)
 * and renders the top-level navigation bar.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
