"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';

type Game = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
};

type Vote = {
  id: string;
  game_id: string;
  value: number;
};

type DiscoveryPageProps = {
  user: { id: string } | null;
  isConfigured: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function DiscoveryPage({ user, isConfigured }: DiscoveryPageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const activeUser = user || clientUser;

  const loadRandomGames = async () => {
    setLoading(true);
    if (!isConfigured) {
      setGames([]);
      setLoading(false);
      setStatusMessage('Live game data is unavailable until Supabase is configured.');
      return;
    }

    try {
      const response = await fetch('/api/games/random?limit=9');
      if (!response.ok) {
        setStatusMessage('No games available to discover yet.');
        setGames([]);
        setLoading(false);
        return;
      }

      const { data } = await response.json();
      setGames(data as Game[]);

      if (activeUser?.id) {
        const supabase = createClient();
        if (supabase) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('id,game_id,value')
            .eq('user_id', activeUser.id);
          const voteMap = Object.fromEntries((voteData ?? []).map((vote: Vote) => [vote.game_id, vote]));
          setVotes(voteMap);
        }
      }
    } catch (error) {
      console.error('Error loading random games:', error);
      setStatusMessage('Failed to load discovery games. Please try again.');
      setGames([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setClientUser({ id: data.user.id });
      }
    });

    loadRandomGames();
  }, [isConfigured, activeUser?.id]);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      const metadataEntries = await Promise.all(
        games.map(async (game) => [game.id, await getRobloxGameMetadata(game.roblox_url)] as const)
      );
      const nextMetadata = Object.fromEntries(metadataEntries);
      if (!ignore) {
        setMetadataMap(nextMetadata);
      }
    };

    if (games.length > 0) {
      loadMetadata();
    }
    return () => {
      ignore = true;
    };
  }, [games]);

  const handleVote = async (gameId: string, value: number) => {
    if (!isConfigured || !activeUser) {
      setStatusMessage('Connect Supabase and sign in to enable live voting.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatusMessage('Connect Supabase and sign in to enable live voting.');
      return;
    }

    const existing = votes[gameId];
    if (existing?.value === value) {
      await supabase.from('votes').delete().eq('id', existing.id);
      setVotes((prev) => {
        const next = { ...prev };
        delete next[gameId];
        return next;
      });
      return;
    }

    if (existing) {
      await supabase.from('votes').update({ value }).eq('id', existing.id);
      setVotes((prev) => ({ ...prev, [gameId]: { ...existing, value } }));
      return;
    }

    const { data, error } = await supabase
      .from('votes')
      .insert({ game_id: gameId, user_id: activeUser.id, value })
      .select()
      .single();
    if (!error && data) {
      setVotes((prev) => ({ ...prev, [gameId]: data as Vote }));
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-rbx-border bg-rbx-surface p-10 md:p-14">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-rbx-purple/30 to-rbx-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-rbx-red/20 to-rbx-orange/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
              Discovery
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              Discover hidden{' '}
              <span className="bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange bg-clip-text text-transparent">
                Roblox gems
              </span>
            </h1>
            <p className="mt-6 text-base text-rbx-muted leading-relaxed max-w-lg">
              Get surprised with random Roblox games. Refresh to discover something new every time.
            </p>
          </div>
          <button
            onClick={loadRandomGames}
            disabled={loading}
            className="self-start shrink-0 rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-8 py-4 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:opacity-50"
          >
            {loading ? '⟳ Loading...' : '⟳ Shuffle'}
          </button>
        </div>
        {statusMessage ? (
          <p className="relative mt-8 rounded-xl border border-rbx-border bg-rbx-surface-2 px-5 py-4 text-sm text-rbx-muted">{statusMessage}</p>
        ) : null}
      </section>

      {/* Games Grid */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-rbx-orange via-rbx-red to-rbx-purple" />
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white">Random Selection</h2>
            <span className="text-xs text-rbx-muted">Different every refresh</span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
            ))}
          </div>
        ) : !games.length ? (
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
            <h3 className="text-lg font-bold text-white">No games have been shared yet.</h3>
            <p className="mt-3 text-sm text-rbx-muted">Be the first to submit a Roblox game to start the discovery.</p>
            <Link
              href="/submit"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange"
            >
              Submit a game →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => {
              const metadata = metadataMap[game.id];
              const userVote = votes[game.id];
              return (
                <article
                  key={game.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-rbx-border hover:bg-rbx-surface-2 hover:-translate-y-px"
                >
                  {/* Gradient top accent strip */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />

                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden bg-rbx-surface-3">
                    {metadata?.thumbnail_url ? (
                      <img
                        src={metadata.thumbnail_url}
                        alt={game.title}
                        width={640}
                        height={360}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-black text-rbx-muted">RBX</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white leading-tight line-clamp-2">{metadata?.title || game.title}</h3>
                      <p className="mt-2 text-xs text-rbx-muted line-clamp-2 leading-relaxed">{metadata?.description || game.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-2.5 py-1 text-white font-medium">
                        👥 {formatStat(metadata?.player_count)}
                      </span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-2.5 py-1 text-white font-medium">
                        🎮 {formatStat(metadata?.visits)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      <a
                        href={game.roblox_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-xs font-bold text-white text-center transition hover:opacity-90"
                      >
                        ▶ Play Now
                      </a>
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-rbx-border bg-rbx-surface-2">
                          <button
                            type="button"
                            aria-label={`Upvote ${metadata?.title || game.title}`}
                            onClick={() => handleVote(game.id, 1)}
                            className={`flex-1 px-2 py-1.5 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                              userVote?.value === 1 ? 'text-rbx-orange' : 'text-rbx-muted'
                            }`}
                          >
                            ▲
                          </button>
                          <span className="border-x border-rbx-border px-2 py-1.5 text-xs font-black text-white">
                            {userVote?.value ?? 0}
                          </span>
                          <button
                            type="button"
                            aria-label={`Downvote ${metadata?.title || game.title}`}
                            onClick={() => handleVote(game.id, -1)}
                            className={`flex-1 px-2 py-1.5 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                              userVote?.value === -1 ? 'text-rbx-red' : 'text-rbx-muted'
                            }`}
                          >
                            ▼
                          </button>
                        </div>
                        <Link
                          href={`/game/${game.id}`}
                          className="rounded-lg border border-rbx-border px-3 py-1.5 text-xs font-semibold text-rbx-muted transition hover:text-white hover:border-white/20 focus-visible:ring-2 focus-visible:ring-rbx-orange"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Info Card */}
      <div className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/20 via-rbx-red/10 to-transparent" />
        <p className="relative text-base font-black text-white">Found something amazing?</p>
        <p className="relative mt-2 text-sm text-rbx-muted">Share your favorite Roblox games with the community.</p>
        <Link
          href="/submit"
          className="relative mt-6 inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange"
        >
          Submit a game →
        </Link>
      </div>
    </main>
  );
}
