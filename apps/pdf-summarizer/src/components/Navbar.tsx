'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

/**
 * Top navigation bar — shows app links and session-aware auth button.
 */
export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/upload', label: 'Upload' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-white hover:text-indigo-400 transition"
        >
          PDF Summarizer
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition ${
                pathname === href
                  ? 'font-semibold text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth button */}
        <div className="flex items-center gap-3">
          {status === 'loading' ? null : session ? (
            <>
              <span className="hidden text-sm text-gray-400 md:inline">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => void signOut()}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => void signIn()}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
