"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';

const isValidRobloxUrl = (value: string) => /^https?:\/\/([a-z0-9-]+\.)?roblox\.com\//i.test(value);

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [robloxUrl, setRobloxUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState<RobloxMetadata | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      if (!robloxUrl || !isValidRobloxUrl(robloxUrl)) {
        setMetadata(null);
        return;
      }

      const info = await getRobloxGameMetadata(robloxUrl);
      if (!ignore) {
        setMetadata(info);
        if (info?.title) {
          setTitle((current) => current || info.title);
        }
        if (info?.description) {
          setDescription((current) => current || info.description);
        }
      }
    };

    loadMetadata();
    return () => {
      ignore = true;
    };
  }, [robloxUrl]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!isValidRobloxUrl(robloxUrl)) {
      setMessage('Please enter a valid Roblox link.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage('Supabase is not configured yet. Add your URL and anon key to .env.local to enable submissions.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('You must be signed in with Roblox to submit a game.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('games').insert({
      title: title || metadata?.title || 'Untitled Roblox game',
      description: description || metadata?.description || 'A fresh Roblox experience from the community.',
      roblox_url: robloxUrl,
      user_id: user.id,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto flex max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <div className="mb-8 max-w-2xl">
          <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
            Submit a game
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Share a Roblox experience with the community</h1>
          <p className="mt-3 text-rbx-muted text-sm">Paste a Roblox game link and the form will pull in the title, thumbnail, player count, and visits automatically.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="block text-sm font-bold text-white">
              Roblox URL
              <input required type="url" value={robloxUrl} onChange={(event) => setRobloxUrl(event.target.value)} className="mt-1.5 w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-3 text-white placeholder-rbx-muted outline-none transition focus:border-rbx-red" />
            </label>
            <label className="block text-sm font-bold text-white">
              Title
              <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-3 text-white placeholder-rbx-muted outline-none transition focus:border-rbx-red" />
            </label>
            <label className="block text-sm font-bold text-white">
              Description
              <textarea required rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-3 text-white placeholder-rbx-muted outline-none transition focus:border-rbx-red" />
            </label>
            <button type="submit" disabled={loading} className="w-fit rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit game →'}
            </button>
          </form>

          <aside className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/15 via-transparent to-rbx-orange/10" />
            <p className="relative text-[11px] font-black uppercase tracking-widest text-rbx-muted mb-4">Auto preview</p>
            {metadata ? (
              <div className="relative space-y-4">
                {metadata.thumbnail_url ? (
                  <img src={metadata.thumbnail_url} alt={metadata.title} className="h-40 w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-rbx-surface-3 text-sm text-rbx-muted">Roblox thumbnail unavailable</div>
                )}
                <div>
                  <h2 className="text-base font-bold text-white">{metadata.title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-rbx-muted">{metadata.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white font-medium">👥 {formatStat(metadata.player_count)}</span>
                  <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white font-medium">🎮 {formatStat(metadata.visits)}</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl border border-rbx-border bg-rbx-surface p-4 text-sm text-rbx-muted">
                Paste a Roblox game link to auto-fill a polished preview card.
              </div>
            )}
          </aside>
        </div>

        {message ? <p className="mt-6 rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">{message}</p> : null}
      </div>
    </main>
  );
}
