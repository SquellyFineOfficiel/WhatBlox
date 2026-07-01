"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRobloxLogin = () => {
    setLoading(true);
    setMessage('');

    const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
    if (!clientId) {
      setMessage('Roblox OAuth is not configured. Add NEXT_PUBLIC_ROBLOX_CLIENT_ID to .env.local.');
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
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm animate-scale-in">

        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rbx-border bg-rbx-surface-2 shadow-lg shadow-black/40">
            <Image src="/branding/logo.png" alt="WhatBlox" width={36} height={36} className="rounded-lg" priority />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-white">Welcome to WhatBlox</h1>
            <p className="mt-1.5 text-sm text-rbx-muted">The place where hidden gems get discovered.</p>
          </div>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface shadow-2xl shadow-black/40">

          {/* Sign in button — top prominence */}
          <div className="px-6 pt-6 pb-5">
            <button
              type="button"
              onClick={handleRobloxLogin}
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-rbx-orange/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rbx-orange"
            >
              <span className="flex items-center justify-center gap-2.5">
                <Image
                  src="/branding/roblox-logo.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Connecting…
                  </span>
                ) : 'Continue with Roblox'}
              </span>
            </button>

            {message && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400 animate-fade-in">
                {message}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-rbx-border/60" />

          {/* Feature list */}
          <div className="space-y-0">
            {[
              {
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                label: 'No password needed',
                sub: 'Your Roblox account is all you need',
              },
              {
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                ),
                label: 'Real accounts only',
                sub: 'Verified Roblox identity, no bots',
              },
              {
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
                label: 'Instant access',
                sub: 'Vote, review and share in seconds',
              },
            ].map((feat, i) => (
              <div key={i} className={`flex items-start gap-3 px-6 py-4 ${i < 2 ? 'border-b border-rbx-border/40' : ''}`}>
                <span className="mt-0.5 shrink-0 text-rbx-orange">{feat.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{feat.label}</p>
                  <p className="text-xs text-rbx-muted">{feat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Legal */}
          <div className="border-t border-rbx-border/60 px-6 py-4">
            <p className="text-center text-[11px] leading-5 text-rbx-muted">
              By continuing you agree to our{' '}
              <Link href="/terms-of-service" className="text-white underline-offset-2 hover:underline">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="text-white underline-offset-2 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-rbx-muted">
          No Roblox account?{' '}
          <a
            href="https://www.roblox.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rbx-orange hover:underline underline-offset-2"
          >
            Create one free →
          </a>
        </p>
      </div>
    </main>
  );
}