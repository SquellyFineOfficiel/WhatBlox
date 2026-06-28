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

const fallbackGames: Game[] = [
  {
    id: 'demo-1',
    title: 'Skybound Adventures',
    description: 'A cozy open-world quest with handcrafted islands and weekly events.',
    roblox_url: 'https://www.roblox.com/games/3156446448/Retro-Highway',
    created_at: '2026-06-01T12:00:00.000Z',
    user_id: 'demo',
  },
  {
    id: 'demo-2',
    title: 'Pixel Harbor',
    description: 'A social building game where players trade stories and custom decorations.',
    roblox_url: 'https://www.roblox.com/games/5733534014/Tower-of-Hell',
    created_at: '2026-06-10T10:30:00.000Z',
    user_id: 'demo',
  },
  {
    id: 'demo-3',
    title: 'Neon Drift',
    description: 'A fast arcade racing experience with original music and daily challenges.',
    roblox_url: 'https://www.roblox.com/games/8540346411/Speed-Run-4',
    created_at: '2026-06-15T08:45:00.000Z',
    user_id: 'demo',
  },
];

export default function HomePage({ user, isConfigured }: HomePageProps) {
  const [games, setGames] = useState<Game[]>(fallbackGames);
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
        setGames(fallbackGames);
        setLoading(false);
        setStatusMessage('Supabase is not configured yet, so you are viewing sample games.');
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setGames(fallbackGames);
        setLoading(false);
        setStatusMessage('Supabase is not configured yet, so you are viewing sample games.');
        return;
      }

      const { data, error } = await supabase
        .from('games')
        .select('id,title,description,roblox_url,created_at,user_id')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGames(data as Game[]);
        if (activeUser?.id) {
          const { data: voteData } = await supabase.from('votes').select('id,game_id,value').eq('user_id', activeUser.id);
          const voteMap = Object.fromEntries((voteData ?? []).map((vote: Vote) => [vote.game_id, vote]));
          setVotes(voteMap);
        }
      } else {
        setGames(fallbackGames);
        setStatusMessage('Live data was unavailable, so the preview uses sample games.');
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
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">

      {/* Hero — diagonal gradient mesh */}
      <section className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface p-8 md:p-10">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-rbx-purple/30 to-rbx-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-rbx-red/20 to-rbx-orange/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
              WhatBlox
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Find the next Roblox game{' '}
              <span className="bg-gradient-to-r from-rbx-red via-rbx-red to-rbx-orange bg-clip-text text-transparent">
                everyone is talking about
              </span>
            </h1>
            <p className="mt-4 text-base text-rbx-muted leading-relaxed">
              Discover curated Roblox experiences, inspect live player activity, and vote on the games you love.
            </p>
          </div>
          <Link
            href="/submit"
            className="self-start shrink-0 rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
          >
            Submit a game →
          </Link>
        </div>
        {statusMessage ? (
          <p className="relative mt-6 rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">{statusMessage}</p>
        ) : null}
      </section>

      <section className="space-y-8">
        {/* Trending list */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-rbx-red to-rbx-orange" />
            <h2 className="text-base font-black uppercase tracking-widest text-white">Trending</h2>
            <span className="text-xs text-rbx-muted">Fresh uploads · live stats</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game, idx) => {
                const metadata = metadataMap[game.id];
                const userVote = votes[game.id];
                return (
                  <article
                    key={game.id}
                    className="group relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-rbx-border hover:-translate-y-px"
                  >
                    {/* Gradient left accent strip */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-rbx-purple via-rbx-red to-rbx-orange" />

                    <div className="flex flex-col gap-4 pl-5 pr-5 py-5 sm:flex-row">
                      {/* Rank */}
                      <div className="hidden sm:flex shrink-0 w-6 items-start justify-center pt-1">
                        <span className="text-xs font-black text-rbx-muted">#{idx + 1}</span>
                      </div>

                      {/* Thumbnail */}
                      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-rbx-surface-3 sm:w-36">
                        {metadata?.thumbnail_url ? (
                          <img src={metadata.thumbnail_url} alt={game.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rbx-surface-2 to-rbx-surface-3 text-xs font-black text-rbx-muted">RBX</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-white leading-tight">{metadata?.title || game.title}</h3>
                          <span className="text-xs text-rbx-muted shrink-0">{new Date(game.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-rbx-muted line-clamp-2 leading-relaxed">{metadata?.description || game.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-2.5 py-1 text-white font-medium">
                            👥 {formatStat(metadata?.player_count)}
                          </span>
                          <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-2.5 py-1 text-white font-medium">
                            🎮 {formatStat(metadata?.visits)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* Vote widget */}
                          <div className="flex items-center overflow-hidden rounded-lg border border-rbx-border bg-rbx-surface-2">
                            <button
                              onClick={() => handleVote(game.id, 1)}
                              className={`px-3 py-1.5 text-sm font-bold transition hover:bg-rbx-surface-3 ${userVote?.value === 1 ? 'text-rbx-orange' : 'text-rbx-muted'}`}
                            >▲</button>
                            <span className="border-x border-rbx-border px-3 py-1.5 text-sm font-black text-white min-w-[2rem] text-center">
                              {userVote?.value ?? 0}
                            </span>
                            <button
                              onClick={() => handleVote(game.id, -1)}
                              className={`px-3 py-1.5 text-sm font-bold transition hover:bg-rbx-surface-3 ${userVote?.value === -1 ? 'text-rbx-red' : 'text-rbx-muted'}`}
                            >▼</button>
                          </div>
                          <a
                            href={game.roblox_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                          >
                            ▶ Play
                          </a>
                          <Link
                            href={`/game/${game.id}`}
                            className="rounded-lg border border-rbx-border px-4 py-1.5 text-xs font-semibold text-rbx-muted transition hover:text-white hover:border-white/20"
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
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-rbx-purple to-rbx-red" />
            <h2 className="text-base font-black uppercase tracking-widest text-white">Recent</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {games.slice(0, 5).map((game, idx) => (
              <article
                key={`${game.id}-recent`}
                className="min-w-[240px] rounded-xl border border-rbx-border bg-rbx-surface p-4 transition hover:bg-rbx-surface-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-rbx-red to-rbx-orange text-[10px] font-black text-white">
                  {idx + 1}
                </span>
                <div className="mt-2 min-w-0">
                  <p className="truncate text-sm font-bold text-white">{game.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-rbx-muted leading-relaxed">{game.description}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Submit CTA card */}
          <div className="relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/20 via-rbx-red/10 to-transparent" />
            <p className="relative text-sm font-black text-white">Got a hidden gem?</p>
            <p className="relative mt-1 text-xs text-rbx-muted">Share your Roblox game with the community.</p>
            <Link
              href="/submit"
              className="relative mt-4 inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              Submit a game →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
