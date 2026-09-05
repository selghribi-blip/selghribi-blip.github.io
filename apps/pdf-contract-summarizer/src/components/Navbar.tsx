"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="font-bold text-lg text-teal-400 hover:text-teal-300"
        >
          PDF Summarizer
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className="text-slate-300 hover:text-white transition-colors"
          >
            History
          </Link>
          <Link
            href="/billing"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Billing
          </Link>
        </div>

        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-slate-400 hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-slate-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg hover:border-white/30 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
