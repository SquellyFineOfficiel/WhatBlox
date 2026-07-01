'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type PreferenceKey =
  | 'votesAndReplies'
  | 'newComments'
  | 'weeklyUpdates'
  | 'compactCards'
  | 'hideSensitiveContent'
  | 'privateProfile';

type Preferences = Record<PreferenceKey, boolean>;

const STORAGE_KEY = 'whatblox-preferences-v1';

const DEFAULT_PREFERENCES: Preferences = {
  votesAndReplies: true,
  newComments: true,
  weeklyUpdates: false,
  compactCards: false,
  hideSensitiveContent: false,
  privateProfile: false,
};

const PREFERENCE_ITEMS: Array<{ key: PreferenceKey; title: string; description: string }> = [
  {
    key: 'votesAndReplies',
    title: 'Votes and replies',
    description: 'Get notified when your game receives a vote or someone replies to your comment.',
  },
  {
    key: 'newComments',
    title: 'New comments',
    description: 'Receive updates when users comment on your submitted games.',
  },
  {
    key: 'weeklyUpdates',
    title: 'Weekly digest',
    description: 'A summary of your game performance and discovery trends each week.',
  },
  {
    key: 'compactCards',
    title: 'Compact cards',
    description: 'Use a denser card layout on discovery and dashboard pages.',
  },
  {
    key: 'hideSensitiveContent',
    title: 'Hide sensitive content',
    description: 'Filter mature or sensitive game descriptions from listings.',
  },
  {
    key: 'privateProfile',
    title: 'Private profile',
    description: 'Hide your profile details from other users across shared pages.',
  },
];

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Partial<Preferences>;
      setPreferences((prev) => ({ ...prev, ...parsed }));
    } catch (error) {
      console.error('Failed to parse saved preferences', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [isLoaded, preferences]);

  const enabledCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences],
  );

  const togglePreference = (key: PreferenceKey) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 border-b border-rbx-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
              Settings
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Personalize your WhatBlox experience</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rbx-muted sm:text-base">
              Update your notifications, content preferences, and privacy options. Changes are saved automatically on this device.
            </p>
          </div>
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">
            <span className="font-bold text-white">{enabledCount}</span> / {PREFERENCE_ITEMS.length} enabled
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Preferences</h2>
              <button
                type="button"
                onClick={() => setPreferences(DEFAULT_PREFERENCES)}
                className="rounded-lg border border-rbx-border px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-rbx-muted transition hover:bg-rbx-surface hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {PREFERENCE_ITEMS.map((item) => {
                const isEnabled = preferences[item.key];

                return (
                  <div key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-rbx-border/80 bg-rbx-surface px-4 py-4">
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-rbx-muted sm:text-sm">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${item.title}`}
                      onClick={() => togglePreference(item.key)}
                      className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                        isEnabled
                          ? 'border-transparent bg-gradient-to-r from-rbx-red to-rbx-orange'
                          : 'border-rbx-border bg-rbx-surface-2'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                          isEnabled ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5 sm:p-6">
              <h2 className="text-lg font-black text-white">Account</h2>
              <div className="mt-4 space-y-2">
                <Link href="/dashboard" className="flex w-full items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                  Dashboard
                  <span className="text-rbx-muted">→</span>
                </Link>
                <Link href="/playlist" className="flex w-full items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                  Playlists
                  <span className="text-rbx-muted">→</span>
                </Link>
                <Link href="/auth" className="flex w-full items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                  Manage sign-in
                  <span className="text-rbx-muted">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5 sm:p-6">
              <h2 className="text-lg font-black text-white">Policies</h2>
              <div className="mt-4 space-y-2">
                <Link href="/privacy-policy" className="flex w-full items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                  Privacy policy
                  <span className="text-rbx-muted">→</span>
                </Link>
                <Link href="/terms-of-service" className="flex w-full items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                  Terms of service
                  <span className="text-rbx-muted">→</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}