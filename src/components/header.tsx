'use client';

import Link from 'next/link';
import Image from 'next/image';
import UserHeader from '@/src/components/user-header';
import SearchBar from '@/src/components/search-bar';
import NotificationsBell from '@/src/components/notifications-bell';

export default function Header() {
  return (
    <header className="bg-rbx-surface/90 backdrop-blur sticky top-0 z-50 border-b border-rbx-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-4 rounded-md focus-visible:ring-2 focus-visible:ring-rbx-orange">
          <Image
            src="/branding/logo.png"
            alt="WhatBlox logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <div>
            <p className="text-base font-black tracking-tight bg-gradient-to-r from-rbx-red to-rbx-orange bg-clip-text text-transparent">WhatBlox</p>
            <p className="text-[10px] text-rbx-muted leading-none">Discover indie Roblox games</p>
          </div>
        </Link>
        <SearchBar />
        <div className="flex items-center gap-6 text-sm font-semibold text-rbx-muted">
          <Link href="/" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Trending</Link>
          <Link href="/wishlist" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Wishlist</Link>
          <Link href="/submit" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Submit</Link>
          <NotificationsBell />
          <UserHeader />
        </div>
      </div>
    </header>
  );
}
