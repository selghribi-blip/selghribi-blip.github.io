import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF & Contract Summarizer",
  description:
    "Instantly summarize PDFs and contracts with AI. Free plan with 3 summaries/month; Pro plan at $19/month includes 200 summaries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="site-header">
          <nav>
            <a href="/" className="site-header__logo">
              PDF Summarizer
            </a>
            <ul className="site-header__nav">
              <li><a href="/pricing">Pricing</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>
            &copy; {new Date().getFullYear()} PDF &amp; Contract Summarizer.
            Powered by OpenAI &amp; Stripe.
          </p>
        </footer>
      </body>
    </html>
  );
}
