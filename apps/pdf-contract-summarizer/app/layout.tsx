import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF & Contract Summarizer",
  description:
    "Summarize PDFs and analyze contracts instantly with AI. Free plan: 3/day. Pro: 200/month with overage billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 font-sans">
        {children}
      </body>
    </html>
  );
}
