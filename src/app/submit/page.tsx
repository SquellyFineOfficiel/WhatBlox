"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';

const isValidRobloxUrl = (v: string) => /^https?:\/\/([a-z0-9-]+\.)?roblox\.com\//i.test(v);

const PRESET_TAGS = [
  'Roleplay', 'Simulator', 'Tycoon', 'Obby', 'FPS', 'Horror',
  'Hang out', 'Racing', 'Battle Royale', 'Fighting', 'Tower Defense',
  'RPG', 'Adventure', 'Puzzle', 'Music', 'Competitive', 'Co-op',
  'Story', 'Sandbox', 'Survival', 'PvP', 'Social', 'Comedy', 'Educational',
];

export default function SubmitPage() {
  const router = useRouter();
  const [robloxUrl, setRobloxUrl] = useState('');
  const [reviewerMessage, setReviewerMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState<RobloxMetadata | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const customTagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!robloxUrl || !isValidRobloxUrl(robloxUrl)) {
        setMetadata(null);
        setIsDuplicate(false);
        return;
      }
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.from('games').select('id').eq('roblox_url', robloxUrl).single();
        if (!ignore) setIsDuplicate(!!data);
      }
      const info = await getRobloxGameMetadata(robloxUrl);
      if (!ignore) setMetadata(info);
    };
    load();
    return () => { ignore = true; };
  }, [robloxUrl]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 8 ? [...prev, tag] : prev
    );
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 8) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTagInput('');
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomTag();
    }
  };

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
      setMessage('This game has already been submitted.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage('Supabase is not configured. Add your keys to .env.local.');
      setLoading(false);
      return;
    }

    let userId: string | null = null;
    try {
      const res = await fetch('/api/auth/user');
      if (!res.ok) {
        setMessage('Sign in with Roblox to submit a game.');
        setLoading(false);
        return;
      }
      const userData = await res.json();
      if (!userData.user?.id) {
        setMessage('Sign in with Roblox to submit a game.');
        setLoading(false);
        return;
      }
      userId = userData.user.id;
    } catch {
      setMessage('Failed to verify authentication. Please try again.');
      setLoading(false);
      return;
    }

    if (!metadata) {
      setMessage('Unable to load game details from Roblox. Check the URL and try again.');
      setLoading(false);
      return;
    }

    const tagsPrefix = selectedTags.length > 0
      ? `[Tags: ${selectedTags.join(', ')}]\n`
      : '';
    const fullMessage = tagsPrefix + (reviewerMessage.trim() || '');

    const { error } = await supabase.from('games').insert({
      title: metadata.title,
      description: metadata.description,
      roblox_url: robloxUrl,
      user_id: userId,
      reviewer_message: fullMessage || null,
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Share a game</h1>
        <p className="mt-1.5 text-sm text-rbx-muted">Paste a Roblox link and we pull the details automatically.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL */}
          <div>
            <label htmlFor="roblox-url" className="block text-sm font-semibold text-white mb-2">
              Roblox URL
              {isDuplicate && <span className="ml-2 text-xs font-semibold text-rbx-red">Already on platform</span>}
            </label>
            <input
              id="roblox-url"
              required
              type="url"
              name="robloxUrl"
              autoComplete="off"
              inputMode="url"
              spellCheck={false}
              value={robloxUrl}
              onChange={e => setRobloxUrl(e.target.value)}
              placeholder="https://www.roblox.com/games/…"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder:text-rbx-muted transition focus:outline-none focus-visible:ring-2 ${
                isDuplicate
                  ? 'border-rbx-red bg-rbx-surface-2 focus-visible:ring-rbx-red'
                  : 'border-rbx-border bg-rbx-surface-2 focus:border-white/20 focus-visible:ring-rbx-orange'
              }`}
            />
          </div>

          {/* Tags */}
          <fieldset>
            <legend className="text-sm font-semibold text-white">Tags</legend>
            <div className="mb-2 flex items-center justify-end">
              <span className="text-xs text-rbx-muted">{selectedTags.length}/8 selected</span>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-rbx-red/80 to-rbx-orange/80 px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                  >
                    {tag}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                ))}
              </div>
            )}

            {/* Preset tag grid */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.filter(t => !selectedTags.includes(t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={selectedTags.length >= 8}
                  className="rounded-full border border-rbx-border bg-rbx-surface-2 px-3 py-1 text-xs font-medium text-rbx-muted transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="mt-3 flex gap-2">
              <label htmlFor="custom-tag-input" className="sr-only">
                Add custom tag
              </label>
              <input
                id="custom-tag-input"
                ref={customTagRef}
                type="text"
                name="customTag"
                autoComplete="off"
                aria-label="Add custom tag"
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder="Custom tag… (press Enter)"
                maxLength={30}
                className="flex-1 rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-white/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTagInput.trim() || selectedTags.length >= 8}
                className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </fieldset>

          {/* Message for reviewer */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Note for reviewers (optional)</label>
            <textarea
              rows={4}
              autoComplete="off"
              placeholder="Add context or anything you want the review team to know…"
              value={reviewerMessage}
              onChange={e => setReviewerMessage(e.target.value)}
              className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-white placeholder:text-rbx-muted/60 transition focus:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
            />
          </div>

          <button
            type="submit"
            disabled={loading || isDuplicate || !metadata}
            className="w-fit rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-7 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Submitting…' : isDuplicate ? 'Already submitted' : 'Submit game'}
          </button>

          {message && (
            <p className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">
              {message}
            </p>
          )}
        </form>

        {/* Live preview */}
        <aside className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-rbx-muted">Preview</p>
          {isDuplicate ? (
            <p className="rounded-xl border border-rbx-red/30 bg-rbx-red/10 p-4 text-sm text-rbx-red">
              This game is already on the platform.
            </p>
          ) : metadata ? (
            <div className="space-y-4">
              {metadata.thumbnail_url ? (
                <img
                  src={metadata.thumbnail_url}
                  alt={metadata.title}
                  width={640}
                  height={360}
                  loading="lazy"
                  className="aspect-video w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-rbx-surface-3 text-sm text-rbx-muted">No thumbnail</div>
              )}
              <div>
                <h2 className="font-bold text-white">{metadata.title}</h2>
                <p className="mt-1.5 text-xs text-rbx-muted line-clamp-3 leading-relaxed">{metadata.description}</p>
              </div>
              <div className="flex gap-3 text-xs text-rbx-muted">
                <span>{formatStat(metadata.player_count)} playing</span>
                <span>{formatStat(metadata.visits)} visits</span>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map(t => (
                    <span key={t} className="rounded-full bg-rbx-surface px-2.5 py-1 text-xs font-medium text-rbx-muted border border-rbx-border">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-rbx-border bg-rbx-surface p-4 text-sm text-rbx-muted">
              Paste a Roblox link to see a preview here.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}