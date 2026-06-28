"use client";

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

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
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Info Card */}
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface/50 p-8 backdrop-blur">
          {/* Header Badge */}
          <div className="mb-8">
            <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
              Secure Sign In
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            Sign in to WhatBlox
          </h1>
          <p className="text-sm leading-6 text-rbx-muted mb-6">
            Use your Roblox account to access WhatBlox. No password needed, no bots.
          </p>

          {/* Benefits Section */}
          <div className="space-y-3 mb-8 rounded-xl border border-rbx-border bg-rbx-surface-2 p-4">
            <div className="flex items-start gap-3">
              <span className="text-rbx-orange mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold text-white">One-Click Login</p>
                <p className="text-xs text-rbx-muted">Approve on Roblox and you're in</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-rbx-orange mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold text-white">No Passwords</p>
                <p className="text-xs text-rbx-muted">Your Roblox account is your password</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-rbx-orange mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold text-white">Bot-Free</p>
                <p className="text-xs text-rbx-muted">Real Roblox accounts only</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleRobloxLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image
              src="/branding/roblox-logo.svg"
              alt="Roblox logo"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            {loading ? 'Connecting to Roblox…' : 'Continue with Roblox'}
          </button>

          {/* Legal Text */}
          <p className="mt-6 text-xs leading-5 text-rbx-muted text-center">
            By continuing, you agree to the{' '}
            <Link href="/terms-of-service" className="text-white underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-rbx-orange">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy-policy" className="text-white underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-rbx-orange">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Error Messages */}
          <div aria-live="polite">
            {message && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-8 text-center text-xs text-rbx-muted">
          Don't have a Roblox account?{' '}
          <a
            href="https://www.roblox.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rbx-orange hover:underline focus-visible:ring-2 focus-visible:ring-rbx-orange rounded"
          >
            Create one free
          </a>
        </p>
      </div>
    </main>
  );
}
