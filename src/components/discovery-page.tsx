"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';

type Game = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
  tags?: string[] | null;
};

type Vote = {
  id: string;
  game_id: string;
  value: number;
};

type VoteAgg = { up: number; down: number; score: number };

type SortOption = 'trending' | 'newest' | 'top';

type DiscoveryPageProps = {
  user: { id: string } | null;
  isConfigured: boolean;
};

const TAGS = [
  'Roleplay', 'Simulator', 'Tycoon', 'Obby', 'FPS', 'Horror',
  'Hang out', 'Racing', 'Battle Royale', 'Fighting', 'Tower Defense',
  'RPG', 'Adventure', 'Puzzle',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Top Rated' },
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-rbx-border/50 bg-rbx-surface animate-pulse">
      <div className="aspect-video bg-rbx-surface-2" />
      <div className="space-y-2.5 p-4">
        <div className="h-3.5 w-3/4 rounded-full bg-rbx-surface-2" />
        <div className="h-3 w-full rounded-full bg-rbx-surface-2" />
        <div className="h-3 w-1/2 rounded-full bg-rbx-surface-2" />
        <div className="h-7 w-full rounded-full bg-rbx-surface-2" />
      </div>
    </div>
  );
}

export default function DiscoveryPage({ user, isConfigured }: DiscoveryPageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteAgg>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const [sort, setSort] = useState<SortOption>('trending');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const activeUser = user || clientUser;

  useEffect(() => {
    setClientUser(getClientUser());
  }, []);

  // Reload from scratch whenever sort/tag changes.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setPage(1);
    setStatusMessage('');

    const load = async () => {
      if (!isConfigured) {
        if (!ignore) {
          setGames([]);
          setLoading(false);
          setStatusMessage('Live data unavailable until Supabase is configured.');
        }
        return;
      }
      try {
        const params = new URLSearchParams({ sort, page: '1', limit: '24' });
        if (activeTag) params.set('tag', activeTag);
        const res = await fetch(`/api/games?${params.toString()}`);
        if (!res.ok) {
          if (!ignore) {
            setStatusMessage('No games available yet.');
            setGames([]);
            setLoading(false);
          }
          return;
        }
        const payload = await res.json();
        if (ignore) return;
        setGames(payload.data as Game[]);
        setVoteCounts(payload.voteCounts ?? {});
        setTotalPages(payload.pagination?.totalPages ?? 1);
        if (!payload.data?.length) setStatusMessage('No games match this filter yet.');
      } catch {
        if (!ignore) {
          setStatusMessage('Failed to load games. Please try again.');
          setGames([]);
        }
      }
      if (!ignore) setLoading(false);
    };

    load();
    return () => { ignore = true; };
  }, [isConfigured, sort, activeTag]);

  // Load the current user's own votes so we can highlight their choice.
  useEffect(() => {
    if (!activeUser?.id || !isConfigured) return;
    let ignore = false;
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from('votes')
      .select('id,game_id,value')
      .eq('user_id', activeUser.id)
      .then(({ data }) => {
        if (!ignore) setVotes(Object.fromEntries((data ?? []).map((v: Vote) => [v.game_id, v])));
      });
    return () => { ignore = true; };
  }, [activeUser?.id, isConfigured]);

  useEffect(() => {
    let ignore = false;
    if (!games.length) {
      setMetadataLoading(false);
      return;
    }
    const pending = games.filter(g => !(g.id in metadataMap));
    if (!pending.length) {
      setMetadataLoading(false);
      return;
    }
    setMetadataLoading(true);
    const load = async () => {
      const entries = await Promise.all(
        pending.map(async g => [g.id, await getRobloxGameMetadata(g.roblox_url)] as const)
      );
      if (!ignore) {
        setMetadataMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        setMetadataLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ sort, page: String(nextPage), limit: '24' });
      if (activeTag) params.set('tag', activeTag);
      const res = await fetch(`/api/games?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        setGames(prev => [...prev, ...(payload.data as Game[])]);
        setVoteCounts(prev => ({ ...prev, ...(payload.voteCounts ?? {}) }));
        setPage(nextPage);
      }
    } catch {
      setStatusMessage('Failed to load more games.');
    }
    setLoadingMore(false);
  };

  const handleVote = async (gameId: string, value: number) => {
    if (!isConfigured) return;
    if (!activeUser) {
      setStatusMessage('Sign in to vote on games.');
      return;
    }
    const existing = votes[gameId];
    const isToggleOff = existing?.value === value;

    // Optimistic update
    setVotes(prev => {
      const next = { ...prev };
      if (isToggleOff) delete next[gameId];
      else next[gameId] = { id: existing?.id ?? 'pending', game_id: gameId, value };
      return next;
    });
    setVoteCounts(prev => {
      const current = prev[gameId] ?? { up: 0, down: 0, score: 0 };
      const reverted = { ...current };
      if (existing?.value === 1) reverted.up -= 1;
      if (existing?.value === -1) reverted.down -= 1;
      if (!isToggleOff) {
        if (value === 1) reverted.up += 1;
        else reverted.down += 1;
      }
      reverted.score = reverted.up - reverted.down;
      return { ...prev, [gameId]: reverted };
    });

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoteCounts(prev => ({ ...prev, [gameId]: { ...(prev[gameId] ?? { up: 0, down: 0 }), score: data.score } }));
      }
    } catch {
      setStatusMessage('Failed to save your vote. Please try again.');
    }
  };

  const showSkeletons = loading || (games.length > 0 && metadataLoading && Object.keys(metadataMap).length === 0);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Discover games</h1>
        <div className="flex gap-1 rounded-full border border-rbx-border bg-rbx-surface-2 p-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSort(opt.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                sort === opt.value ? 'bg-gradient-to-r from-rbx-red to-rbx-orange text-white' : 'text-rbx-muted hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag chips — horizontally scrollable on mobile */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:overflow-visible">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
            activeTag === null
              ? 'border-transparent bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
              : 'border-rbx-border bg-rbx-surface-2 text-rbx-muted hover:text-white hover:border-white/20'
          }`}
        >
          All
        </button>
        {TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(prev => (prev === tag ? null : tag))}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
              activeTag === tag
                ? 'border-transparent bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                : 'border-rbx-border bg-rbx-surface-2 text-rbx-muted hover:text-white hover:border-white/20'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {statusMessage && (
        <p className="rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-rbx-muted">{statusMessage}</p>
      )}

      {showSkeletons ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !games.length ? (
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h2 className="text-lg font-bold text-white">No games shared yet.</h2>
          <p className="mt-2 text-sm text-rbx-muted">Be the first to submit one.</p>
          <Link href="/submit" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95">
            Submit a game
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map(game => {
              const meta = metadataMap[game.id];
              const metaReady = game.id in metadataMap;
              const title = meta?.title || game.title;
              const userVote = votes[game.id];
              const score = voteCounts[game.id]?.score ?? 0;
              return (
                <article
                  key={game.id}
                  className={`group overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-white/20 hover:-translate-y-px ${
                    metaReady ? 'animate-fade-in' : ''
                  }`}
                >
                  <Link href={`/game/${game.id}`} className="block aspect-video overflow-hidden bg-rbx-surface-3">
                    {meta?.thumbnail_url ? (
                      <img
                        src={meta.thumbnail_url}
                        alt={title}
                        width={640}
                        height={360}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : metaReady ? (
                      <div className="flex h-full w-full items-center justify-center text-sm font-black text-rbx-muted">RBX</div>
                    ) : (
                      <div className="h-full w-full animate-pulse bg-rbx-surface-2" />
                    )}
                  </Link>
                  <div className="space-y-3 p-4">
                    <Link href={`/game/${game.id}`}>
                      <h3 className="line-clamp-1 text-sm font-bold text-white hover:text-rbx-orange transition">{title}</h3>
                    </Link>
                    {metaReady ? (
                      <>
                        <p className="line-clamp-2 text-xs text-rbx-muted">{meta?.description || game.description}</p>
                        <div className="flex gap-3 text-xs text-rbx-muted">
                          <span>{formatStat(meta?.player_count)} playing</span>
                          <span>{formatStat(meta?.visits)} visits</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-full animate-pulse rounded-full bg-rbx-surface-2" />
                        <div className="h-3 w-2/3 animate-pulse rounded-full bg-rbx-surface-2" />
                      </>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        aria-label={`Upvote ${title}`}
                        onClick={() => handleVote(game.id, 1)}
                        className={`min-h-[2.25rem] rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                          userVote?.value === 1 ? 'bg-rbx-orange text-white' : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                        }`}
                      >▲</button>
                      <span className="min-w-[1.5rem] text-center text-xs font-black tabular-nums text-white">{score}</span>
                      <button
                        type="button"
                        aria-label={`Downvote ${title}`}
                        onClick={() => handleVote(game.id, -1)}
                        className={`min-h-[2.25rem] rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                          userVote?.value === -1 ? 'bg-rbx-red text-white' : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                        }`}
                      >▼</button>
                      <a
                        href={game.roblox_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto min-h-[2.25rem] rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
                      >Play</a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full border border-rbx-border bg-rbx-surface-2 px-6 py-2.5 text-sm font-bold text-white transition hover:border-white/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
