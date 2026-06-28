"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRobloxLogin = () => {
    setLoading(true);
    setMessage('');

    const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
    if (!clientId) {
      setMessage('Add NEXT_PUBLIC_ROBLOX_CLIENT_ID to .env.local to enable Roblox OAuth2.');
      setLoading(false);
      return;
    }

    const origin = window.location.origin.replace('0.0.0.0', 'localhost');
    const redirectUri = `${origin}/auth/roblox/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile',
      state: crypto.randomUUID(),
    });

    window.location.href = `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;
  };

  return (
    <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <div className="mb-6">
          <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
            Roblox sign in
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Continue with your Roblox account</h1>
          <p className="mt-3 text-sm leading-6 text-rbx-muted">Only Roblox OAuth sign-in is available here. This keeps the experience fast, simple, and aligned with the Roblox identity.</p>
        </div>

        <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-4 text-sm">
          <p className="font-bold text-white">What happens next</p>
          <p className="mt-1 text-rbx-muted">You will be sent to Roblox to approve access, then returned to WhatBlox.</p>
        </div>

        <button
          type="button"
          onClick={handleRobloxLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-base font-black">R</span>
          {loading ? 'Connecting to Roblox…' : 'Continue with Roblox'}
        </button>

        <p className="mt-4 text-xs leading-5 text-rbx-muted">
          By continuing, you agree to the{' '}
          <Link href="/terms-of-service" className="text-white underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="text-white underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Privacy Policy
          </Link>
          .
        </p>

        <div aria-live="polite">
          {message ? <p className="mt-4 rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
