import '@/src/styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Header from '@/src/components/header';

export const metadata: Metadata = {
  title: 'WhatBlox',
  description: 'Discover and vote on Roblox games from small developers.',
  icons: {
    icon: '/branding/favicon.png',
    shortcut: '/branding/favicon.png',
    apple: '/branding/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-md bg-rbx-surface-2 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-rbx-orange"
        >
          Skip to main content
        </a>
        <div className="min-h-screen bg-rbx-bg">
          <div className="h-[3px] w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />
          <Suspense fallback={<div className="h-20 bg-rbx-surface" />}>
            <Header />
          </Suspense>
          <div id="main-content">{children}</div>
          <footer className="border-t border-rbx-border bg-rbx-surface/80">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-rbx-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} WhatBlox</p>
              <div className="flex items-center gap-6">
                <Link href="/privacy-policy" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                  Terms of Service
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
