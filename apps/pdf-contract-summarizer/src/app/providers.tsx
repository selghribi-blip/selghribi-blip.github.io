/**
 * app/providers.tsx
 * Client component that wraps the tree with SessionProvider.
 */
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
