"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')[1] ?? null;
}

export default function UserHeader() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const name = getCookieValue('rbx_user_name');
    if (name) {
      setUsername(decodeURIComponent(name));
    }
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm">
      {username ? (
        <>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rbx-red to-rbx-orange text-xs font-black text-white">{username.charAt(0).toUpperCase()}</span>
          <span className="font-semibold text-white">{username}</span>
        </>
      ) : (
        <Link href="/auth" className="text-sm font-semibold text-rbx-muted transition hover:text-white">Sign in →</Link>
      )}
    </div>
  );
}
