"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';

const isValidRobloxUrl = (value: string) => /^https?:\/\/([a-z0-9-]+\.)?roblox\.com\//i.test(value);

export default function SubmitPage() {
  const router = useRouter();
  const [robloxUrl, setRobloxUrl] = useState('');
  const [reviewerMessage, setReviewerMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState<RobloxMetadata | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      if (!robloxUrl || !isValidRobloxUrl(robloxUrl)) {
        setMetadata(null);
        setIsDuplicate(false);
        return;
      }

      // Check if game already exists
      const supabase = createClient();
      if (supabase) {
        const { data: existingGame } = await supabase
          .from('games')
          .select('id')
          .eq('roblox_url', robloxUrl)
          .single();
        
        if (!ignore) {
          setIsDuplicate(!!existingGame);
        }
      }

      // Load Roblox metadata
      const info = await getRobloxGameMetadata(robloxUrl);
      if (!ignore) {
        setMetadata(info);
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

    if (isDuplicate) {
      setMessage('This game has already been submitted to the platform.');
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

    if (!metadata) {
      setMessage('Unable to load game details from Roblox. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('games').insert({
      title: metadata.title,
      description: metadata.description,
      roblox_url: robloxUrl,
      user_id: user.id,
      reviewer_message: reviewerMessage.trim() || null,
      status: 'review',
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto flex max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="w-full rounded-3xl border border-rbx-border bg-rbx-surface p-10 md:p-12">
        <div className="mb-12 max-w-3xl">
          <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
            Submit a game
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Share a Roblox experience with the community</h1>
          <p className="mt-4 text-rbx-muted text-base leading-relaxed">Paste a Roblox game link and we'll automatically pull in the title, thumbnail, player count, and visit statistics. You can add a message for the review team.</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <label className="block text-sm font-bold text-white">
              Roblox URL *
              {isDuplicate && (
                <span className="ml-2 text-xs font-semibold text-rbx-red">Already on platform</span>
              )}
              <input
                required
                type="url"
                name="robloxUrl"
                autoComplete="off"
                inputMode="url"
                spellCheck={false}
                value={robloxUrl}
                onChange={(event) => setRobloxUrl(event.target.value)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-white transition focus-visible:ring-2 ${
                  isDuplicate
                    ? 'border-rbx-red bg-rbx-surface-2 focus:border-rbx-red focus-visible:ring-rbx-red'
                    : 'border-rbx-border bg-rbx-surface-2 focus:border-rbx-red focus-visible:ring-rbx-red'
                }`}
              />
            </label>

            <label className="block text-sm font-bold text-white">
              Message for reviewers (optional)
              <textarea
                rows={5}
                name="reviewerMessage"
                autoComplete="off"
                placeholder="Add any additional context or notes for the review team..."
                value={reviewerMessage}
                onChange={(event) => setReviewerMessage(event.target.value)}
                className="mt-2 w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
              />
            </label>

            <button
              type="submit"
              disabled={loading || isDuplicate || !metadata}
              className="w-fit rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-8 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Submitting…' : isDuplicate ? 'Game already submitted' : 'Submit game →'}
            </button>
          </form>

          <aside className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/15 via-transparent to-rbx-orange/10" />
            <p className="relative text-xs font-black uppercase tracking-widest text-rbx-muted mb-5">Auto preview</p>
            {isDuplicate ? (
              <div className="relative rounded-xl border border-rbx-red bg-rbx-surface p-5 text-sm text-rbx-red">
                ⚠️ This game has already been submitted. Please choose a different game or check the existing submission on the trending page.
              </div>
            ) : metadata ? (
              <div className="relative space-y-5">
                {metadata.thumbnail_url ? (
                  <img
                    src={metadata.thumbnail_url}
                    alt={metadata.title}
                    width={640}
                    height={360}
                    loading="lazy"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-xl bg-rbx-surface-3 text-sm text-rbx-muted">Roblox thumbnail unavailable</div>
                )}
                <div>
                  <h2 className="text-base font-bold text-white">{metadata.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-rbx-muted">{metadata.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">👥 {formatStat(metadata.player_count)}</span>
                  <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">🎮 {formatStat(metadata.visits)}</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl border border-rbx-border bg-rbx-surface p-5 text-sm text-rbx-muted">
                Paste a Roblox game link to auto-fill a polished preview card.
              </div>
            )}
          </aside>
        </div>

        <div aria-live="polite">
          {message ? (
            <p className={`mt-8 rounded-xl border px-5 py-4 text-sm ${
              message.includes('already been submitted') || message.includes('already been')
                ? 'border-rbx-red bg-rbx-surface-2 text-rbx-red'
                : 'border-rbx-border bg-rbx-surface-2 text-rbx-muted'
            }`}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
