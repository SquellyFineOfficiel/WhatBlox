import '@/src/styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import UserHeader from '@/src/components/user-header';

export const metadata: Metadata = {
  title: 'WhatBlox',
  description: 'Discover and vote on Roblox games from indie creators.',
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
          className="sr-only z-[60] rounded-md bg-rbx-surface-2 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-rbx-orange"
        >
          Skip to main content
        </a>
        <div className="min-h-screen bg-rbx-bg">
          <div className="h-[3px] w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />
          <header className="bg-rbx-surface/90 backdrop-blur sticky top-0 z-50 border-b border-rbx-border">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-rbx-orange">
                <Image
                  src="/branding/logo.png"
                  alt="WhatBlox logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                  priority
                />
                <div>
                  <p className="text-base font-black tracking-tight bg-gradient-to-r from-rbx-red to-rbx-orange bg-clip-text text-transparent">WhatBlox</p>
                  <p className="text-[10px] text-rbx-muted leading-none">Discover indie Roblox games</p>
                </div>
              </Link>
              <div className="flex items-center gap-4 text-sm font-semibold text-rbx-muted">
                <Link href="/" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Trending</Link>
                <Link href="/submit" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Submit</Link>
                <UserHeader />
              </div>
            </div>
          </header>
          <div id="main-content">{children}</div>
          <footer className="border-t border-rbx-border bg-rbx-surface/80">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-rbx-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} WhatBlox</p>
              <div className="flex items-center gap-4">
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
