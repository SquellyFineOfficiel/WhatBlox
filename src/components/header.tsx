'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const c = document.cookie.split('; ').find(r => r.startsWith(`${name}=`));
  return c ? c.slice(name.length + 1) : null;
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/discovery', label: 'Discover' },
  { href: '/playlist', label: 'Playlists' },
  { href: '/submit', label: 'Submit' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const name = getCookie('rbx_user_name');
    const avatar = getCookie('rbx_user_avatar');
    if (name) setUsername(decodeURIComponent(name));
    if (avatar) setAvatarUrl(decodeURIComponent(avatar));
  }, []);

  useEffect(() => {
    if (searchOpen) {
      // Small delay so the CSS transition is visible before focusing
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false); }
    };
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchInput('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      const { createClient } = await import('@/src/lib/supabase/client');
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    } catch { /* ignore */ }
    document.cookie = 'rbx_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'rbx_user_avatar=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    window.location.href = '/';
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-rbx-border bg-rbx-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="mr-2 shrink-0 rounded focus-visible:ring-2 focus-visible:ring-rbx-orange" aria-label="WhatBlox home">
          <Image src="/branding/logo.png" alt="" width={32} height={32} className="rounded-lg" priority />
        </Link>

        {/* Desktop nav — always visible */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                  active ? 'bg-rbx-surface-2 text-white' : 'text-rbx-muted hover:bg-rbx-surface-2 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right controls — search slides inline, profile stays fixed */}
        <div className="ml-auto flex items-center gap-1">

          {/* Search: slides in from the right */}
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            {/* Sliding container — clips via overflow-hidden */}
            <div
              className="overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out"
              style={{ maxWidth: searchOpen ? '260px' : '0px', opacity: searchOpen ? 1 : 0 }}
            >
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search games…"
                aria-label="Search games"
                tabIndex={searchOpen ? 0 : -1}
                className="h-9 w-[200px] rounded-full border border-rbx-border bg-rbx-surface-2 px-4 text-sm text-white placeholder:text-rbx-muted focus:border-white/20 focus:outline-none sm:w-[260px]"
              />
            </div>

            {/* Toggle button: search icon ↔ close icon */}
            <button
              type="button"
              onClick={() => {
                if (searchOpen) { setSearchOpen(false); setSearchInput(''); }
                else { setSearchOpen(true); }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-rbx-muted transition hover:bg-rbx-surface-2 hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange"
              aria-label={searchOpen ? 'Close search' : 'Search'}
            >
              {searchOpen ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              )}
            </button>
          </form>

          {/* Profile dropdown */}
          {mounted && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-rbx-border bg-rbx-surface-2 transition hover:border-white/20 focus-visible:ring-2 focus-visible:ring-rbx-orange"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {username && avatarUrl ? (
                  <img src={avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
                ) : username ? (
                  <span className="text-xs font-black text-white">{username.charAt(0).toUpperCase()}</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rbx-muted"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                )}
              </button>

              {menuOpen && (
                <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-xl border border-rbx-border bg-rbx-surface shadow-2xl shadow-black/50">
                  {username ? (
                    <>
                      <div className="border-b border-rbx-border/60 px-4 py-3">
                        <p className="text-[11px] text-rbx-muted">Signed in as</p>
                        <p className="mt-0.5 truncate text-sm font-bold text-white">{username}</p>
                      </div>
                      <div className="space-y-0.5 p-1.5">
                        <DropItem href="/dashboard" onClick={() => setMenuOpen(false)}
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                        >Dashboard</DropItem>
                        <DropItem href="/playlist" onClick={() => setMenuOpen(false)}
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                        >Playlists</DropItem>
                        <DropItem href="/settings" onClick={() => setMenuOpen(false)}
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                        >Settings</DropItem>
                      </div>
                      <div className="border-t border-rbx-border/60 p-1.5">
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rbx-muted transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-1.5">
                      <DropItem href="/auth" onClick={() => setMenuOpen(false)}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
                      >Sign in with Roblox</DropItem>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-2.5 md:hidden" style={{ scrollbarWidth: 'none' }}>
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={`m-${item.href}`}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? 'bg-rbx-surface-2 text-white' : 'text-rbx-muted hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function DropItem({
  href, onClick, icon, children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-rbx-surface-2"
    >
      <span className="text-rbx-muted">{icon}</span>
      {children}
    </Link>
  );
}