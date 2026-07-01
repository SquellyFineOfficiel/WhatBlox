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

  if (!mounted) {
    return null;
  }

  if (!username) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-rbx-border bg-rbx-surface-2 transition hover:border-white/20 hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange"
      title={`${username} dashboard`}
      aria-label={`${username} dashboard`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          width={36}
          height={36}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-black text-white">{username.charAt(0).toUpperCase()}</span>
      )}
    </Link>
  );
}
