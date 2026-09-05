"use client";

import Link from "next/link";

type Props = {
  userImage?: string | null;
  userName?: string | null;
};

export function Navbar({ userImage, userName }: Props) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          📄 PDF &amp; Contract Summarizer
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          {userName ? (
            <div className="flex items-center gap-2">
              {userImage && (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm text-white font-medium hover:bg-indigo-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
