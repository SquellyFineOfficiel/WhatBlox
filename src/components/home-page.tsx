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

type HomePageProps = {
  user: { id: string } | null;
  isConfigured: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function HomePage({ user, isConfigured }: HomePageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const activeUser = user || clientUser;

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

    async function loadGames() {
      if (!isConfigured) {
        setGames([]);
        setLoading(false);
        setStatusMessage('Live game data is unavailable until Supabase is configured.');
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setGames([]);
        setLoading(false);
        setStatusMessage('Live game data is unavailable until Supabase is configured.');
        return;
      }

      const { data, error } = await supabase
        .from('games')
        .select('id,title,description,roblox_url,created_at,user_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGames(data as Game[]);
        if (activeUser?.id) {
          const { data: voteData } = await supabase.from('votes').select('id,game_id,value').eq('user_id', activeUser.id);
          const voteMap = Object.fromEntries((voteData ?? []).map((vote: Vote) => [vote.game_id, vote]));
          setVotes(voteMap);
        }
      } else {
        setGames([]);
        setStatusMessage('Live data is temporarily unavailable. Please try again soon.');
      }
      setLoading(false);
    }

    loadGames();
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

    loadMetadata();
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

    const { data, error } = await supabase.from('votes').insert({ game_id: gameId, user_id: activeUser.id, value }).select().single();
    if (!error && data) {
      setVotes((prev) => ({ ...prev, [gameId]: data as Vote }));
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">

      {/* Hero — diagonal gradient mesh */}
      <section className="relative overflow-hidden rounded-3xl border border-rbx-border bg-rbx-surface p-10 md:p-14">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-rbx-purple/30 to-rbx-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-rbx-red/20 to-rbx-orange/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
              WhatBlox
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              Find the next Roblox game{' '}
              <span className="bg-gradient-to-r from-rbx-red via-rbx-red to-rbx-orange bg-clip-text text-transparent">
                everyone is talking about
              </span>
            </h1>
            <p className="mt-6 text-base text-rbx-muted leading-relaxed max-w-lg">
              Discover curated Roblox experiences, inspect live player activity, and vote on the games you love.
            </p>
          </div>
          <Link
            href="/submit"
            className="self-start shrink-0 rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-8 py-4 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange"
          >
            Submit a game →
          </Link>
        </div>
        {statusMessage ? (
          <p className="relative mt-8 rounded-xl border border-rbx-border bg-rbx-surface-2 px-5 py-4 text-sm text-rbx-muted">{statusMessage}</p>
        ) : null}
      </section>

      <section className="space-y-12">
        {/* Trending list */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-rbx-red to-rbx-orange" />
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-white">Trending</h2>
              <span className="text-xs text-rbx-muted">Fresh uploads · live stats</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : !games.length ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
              <h3 className="text-lg font-bold text-white">No games have been shared yet.</h3>
              <p className="mt-3 text-sm text-rbx-muted">Be the first to submit a Roblox game to start the rankings.</p>
              <Link
                href="/submit"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange"
              >
                Submit a game →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game, idx) => {
                const metadata = metadataMap[game.id];
                const userVote = votes[game.id];
                return (
                  <article
                    key={game.id}
                    className="group relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-rbx-border hover:bg-rbx-surface-2 hover:-translate-y-px"
                  >
                    {/* Gradient left accent strip */}
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rbx-purple via-rbx-red to-rbx-orange" />

                    <div className="flex flex-col gap-5 pl-6 pr-6 py-6 sm:flex-row sm:items-center">
                      {/* Rank */}
                      <div className="hidden sm:flex shrink-0 w-8 items-start justify-center pt-1">
                        <span className="text-sm font-black text-rbx-muted">#{idx + 1}</span>
                      </div>

                      {/* Thumbnail */}
                      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-rbx-surface-3 sm:w-40">
                        {metadata?.thumbnail_url ? (
                          <img
                            src={metadata.thumbnail_url}
                            alt={game.title}
                            width={640}
                            height={360}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rbx-surface-2 to-rbx-surface-3 text-sm font-black text-rbx-muted">RBX</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-white leading-tight">{metadata?.title || game.title}</h3>
                          <span className="text-xs text-rbx-muted shrink-0 pt-1">{dateFormatter.format(new Date(game.created_at))}</span>
                        </div>
                        <p className="mt-2 text-sm text-rbx-muted line-clamp-2 leading-relaxed">{metadata?.description || game.description}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-1.5 text-white font-medium">
                            👥 {formatStat(metadata?.player_count)}
                          </span>
                          <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-1.5 text-white font-medium">
                            🎮 {formatStat(metadata?.visits)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {/* Vote widget */}
                          <div className="flex items-center overflow-hidden rounded-lg border border-rbx-border bg-rbx-surface-2">
                            <button
                              type="button"
                              aria-label={`Upvote ${metadata?.title || game.title}`}
                              onClick={() => handleVote(game.id, 1)}
                              className={`px-4 py-2 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${userVote?.value === 1 ? 'text-rbx-orange' : 'text-rbx-muted'}`}
                            >▲</button>
                            <span className="border-x border-rbx-border px-4 py-2 text-sm font-black text-white min-w-[2.5rem] text-center">
                              {userVote?.value ?? 0}
                            </span>
                            <button
                              type="button"
                              aria-label={`Downvote ${metadata?.title || game.title}`}
                              onClick={() => handleVote(game.id, -1)}
                              className={`px-4 py-2 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${userVote?.value === -1 ? 'text-rbx-red' : 'text-rbx-muted'}`}
                            >▼</button>
                          </div>
                          <a
                            href={game.roblox_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
                          >
                            ▶ Play
                          </a>
                          <Link
                            href={`/game/${game.id}`}
                            className="rounded-lg border border-rbx-border px-5 py-2 text-xs font-semibold text-rbx-muted transition hover:text-white hover:border-white/20 focus-visible:ring-2 focus-visible:ring-rbx-orange"
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
        </div>

        {/* Recent games */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-rbx-purple to-rbx-red" />
            <h2 className="text-lg font-black uppercase tracking-widest text-white">Recent</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 pr-4">
            {(games.length ? games.slice(0, 5) : []).map((game, idx) => (
              <article
                key={`${game.id}-recent`}
                className="min-w-[260px] rounded-xl border border-rbx-border bg-rbx-surface p-5 transition hover:bg-rbx-surface-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-rbx-red to-rbx-orange text-[11px] font-black text-white">
                  {idx + 1}
                </span>
                <div className="mt-3 min-w-0">
                  <p className="truncate text-sm font-bold text-white">{game.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-rbx-muted leading-relaxed">{game.description}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Submit CTA card */}
          <div className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/20 via-rbx-red/10 to-transparent" />
            <p className="relative text-base font-black text-white">Got a hidden gem?</p>
            <p className="relative mt-2 text-sm text-rbx-muted">Share your Roblox game with the community.</p>
            <Link
              href="/submit"
              className="relative mt-6 inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange"
            >
              Submit a game →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
