import '@/src/styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import UserHeader from '@/src/components/user-header';

export const metadata: Metadata = {
  title: 'WhatBlox',
  description: 'Discover and vote on Roblox games from indie creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-rbx-bg">
          {/* Gradient top border */}
          <div className="h-[3px] w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />
          <header className="bg-rbx-surface/90 backdrop-blur sticky top-0 z-50 border-b border-rbx-border">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                {/* Gradient logo mark */}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rbx-red to-rbx-orange text-sm font-black text-white">
                  WB
                </div>
                <div>
                  <p className="text-base font-black tracking-tight bg-gradient-to-r from-rbx-red to-rbx-orange bg-clip-text text-transparent">WhatBlox</p>
                  <p className="text-[10px] text-rbx-muted leading-none">Discover indie Roblox games</p>
                </div>
              </Link>
              <div className="hidden items-center gap-6 text-sm font-semibold text-rbx-muted sm:flex">
                <Link href="/" className="transition hover:text-white">Trending</Link>
                <Link href="/submit" className="transition hover:text-white">Submit</Link>
                <UserHeader />
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
