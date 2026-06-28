"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : null;
}

export default function UserHeader() {
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const name = getCookieValue('rbx_user_name');
    const avatar = getCookieValue('rbx_user_avatar');
    if (name) {
      setUsername(decodeURIComponent(name));
    }
    if (avatar) {
      setAvatarUrl(decodeURIComponent(avatar));
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      // Clear cookies
      document.cookie = 'rbx_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'rbx_user_avatar=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  // Render placeholder on server, actual content on client after mount
  if (!mounted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm">
        <Link href="/auth" className="rounded-md text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Sign in →</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm">
      {username ? (
        <>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-1 py-0.5 font-semibold text-white transition hover:text-rbx-orange focus-visible:ring-2 focus-visible:ring-rbx-orange"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                width={28}
                height={28}
                loading="lazy"
                className="h-7 w-7 rounded-md object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rbx-red to-rbx-orange text-xs font-black text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            )}
            <span>Dashboard</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white transition hover:bg-rbx-surface hover:text-rbx-red disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rbx-orange"
            title="Disconnect"
            aria-label="Disconnect"
          >
            {isLoggingOut ? (
              <span className="text-sm">⟳</span>
            ) : (
              <svg
                className="w-6 h-6"
                viewBox="0 0 1024 1024"
                fill="currentColor"
              >
                <path d="M832.6 191.4c-84.6-84.6-221.5-84.6-306 0l-96.9 96.9 51 51 96.9-96.9c53.8-53.8 144.6-59.5 204 0 59.5 59.5 53.8 150.2 0 204l-96.9 96.9 51.1 51.1 96.9-96.9c84.4-84.6 84.4-221.5-.1-306.1zM446.5 781.6c-53.8 53.8-144.6 59.5-204 0-59.5-59.5-53.8-150.2 0-204l96.9-96.9-51.1-51.1-96.9 96.9c-84.6 84.6-84.6 221.5 0 306s221.5 84.6 306 0l96.9-96.9-51-51-96.8 97zM260.3 209.4a8.03 8.03 0 0 0-11.3 0L209.4 249a8.03 8.03 0 0 0 0 11.3l554.4 554.4c3.1 3.1 8.2 3.1 11.3 0l39.6-39.6c3.1-3.1 3.1-8.2 0-11.3L260.3 209.4z"/>
              </svg>
            )}
          </button>
        </>
      ) : (
        <Link href="/auth" className="rounded-md text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">Sign in →</Link>
      )}
    </div>
  );
}
