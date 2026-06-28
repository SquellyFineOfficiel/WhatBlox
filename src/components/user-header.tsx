"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const name = getCookieValue('rbx_user_name');
    const avatar = getCookieValue('rbx_user_avatar');
    if (name) {
      setUsername(decodeURIComponent(name));
    }
    if (avatar) {
      setAvatarUrl(decodeURIComponent(avatar));
    }
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm">
      {username ? (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-1 py-0.5 font-semibold text-white transition hover:text-rbx-orange"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rbx-red to-rbx-orange text-xs font-black text-white">
              {username.charAt(0).toUpperCase()}
            </span>
          )}
          <span>Dashboard</span>
        </Link>
      ) : (
        <Link href="/auth" className="text-sm font-semibold text-rbx-muted transition hover:text-white">Sign in →</Link>
      )}
    </div>
  );
}
