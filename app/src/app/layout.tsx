import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PDF & Contract Summarizer',
  description:
    'Summarize any PDF in seconds. Contract mode available on Pro plan. Powered by AI.',
  openGraph: {
    title: 'PDF & Contract Summarizer',
    description: 'Summarize any PDF in seconds. Contract mode available on Pro plan.',
    url: 'https://app.artsmoroccan.me',
    siteName: 'PDF & Contract Summarizer',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <a href="/" className="font-bold text-xl text-primary-600 flex items-center gap-2">
                📄 PDF Summarizer
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Pricing
                </a>
                <a
                  href="/dashboard"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Dashboard
                </a>
              </nav>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
            <p>
              Built by{' '}
              <a href="https://artsmoroccan.me" className="underline hover:text-gray-700">
                selghribi
              </a>{' '}
              · Deployed at{' '}
              <a href="https://app.artsmoroccan.me" className="underline hover:text-gray-700">
                app.artsmoroccan.me
              </a>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
