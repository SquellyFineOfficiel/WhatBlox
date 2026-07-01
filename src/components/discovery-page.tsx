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

export default function DiscoveryPage({ user, isConfigured }: DiscoveryPageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const activeUser = user || clientUser;

  const loadGames = async () => {
    setLoading(true);
    if (!isConfigured) {
      setGames([]);
      setLoading(false);
      setStatusMessage('Live data unavailable until Supabase is configured.');
      return;
    }
    try {
      const res = await fetch('/api/games/random?limit=24');
      if (!res.ok) {
        setStatusMessage('No games available yet.');
        setGames([]);
        setLoading(false);
        return;
      }
      const { data } = await res.json();
      setGames(data as Game[]);
      if (activeUser?.id) {
        const supabase = createClient();
        if (supabase) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('id,game_id,value')
            .eq('user_id', activeUser.id);
          setVotes(Object.fromEntries((voteData ?? []).map((v: Vote) => [v.game_id, v])));
        }
      }
    } catch {
      setStatusMessage('Failed to load games. Please try again.');
      setGames([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setClientUser({ id: data.user.id });
    });
    loadGames();
  }, [isConfigured, activeUser?.id]);

  useEffect(() => {
    let ignore = false;
    if (!games.length) return;
    const load = async () => {
      const entries = await Promise.all(
        games.map(async g => [g.id, await getRobloxGameMetadata(g.roblox_url)] as const)
      );
      if (!ignore) setMetadataMap(Object.fromEntries(entries));
    };
    load();
    return () => { ignore = true; };
  }, [games]);

  const handleVote = async (gameId: string, value: number) => {
    if (!isConfigured || !activeUser) return;
    const supabase = createClient();
    if (!supabase) return;
    const existing = votes[gameId];
    if (existing?.value === value) {
      await supabase.from('votes').delete().eq('id', existing.id);
      setVotes(prev => { const n = { ...prev }; delete n[gameId]; return n; });
      return;
    }
    if (existing) {
      await supabase.from('votes').update({ value }).eq('id', existing.id);
      setVotes(prev => ({ ...prev, [gameId]: { ...existing, value } }));
      return;
    }
    const { data, error } = await supabase.from('votes').insert({ game_id: gameId, user_id: activeUser.id, value }).select().single();
    if (!error && data) setVotes(prev => ({ ...prev, [gameId]: data as Vote }));
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Discover games</h1>
        <button
          onClick={loadGames}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-rbx-surface-2 border border-rbx-border px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={loading ? 'animate-spin' : ''}>
            <path d="M3 12a9 9 0 0 1 15-6.7M21 12a9 9 0 0 1-15 6.7"/>
            <polyline points="15 9 21 3 21 9"/><polyline points="9 15 3 21 3 15"/>
          </svg>
          Shuffle
        </button>
      </div>

      {statusMessage && (
        <p className="rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-rbx-muted">{statusMessage}</p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-rbx-surface-2" />
          ))}
        </div>
      ) : !games.length ? (
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h2 className="text-lg font-bold text-white">No games shared yet.</h2>
          <p className="mt-2 text-sm text-rbx-muted">Be the first to submit one.</p>
          <Link href="/submit" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Submit a game
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map(game => {
            const meta = metadataMap[game.id];
            const title = meta?.title || game.title;
            const userVote = votes[game.id];
            return (
              <article key={game.id} className="group overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-white/20 hover:-translate-y-px">
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
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-rbx-muted">RBX</div>
                  )}
                </Link>
                <div className="space-y-3 p-4">
                  <Link href={`/game/${game.id}`}>
                    <h3 className="line-clamp-1 text-sm font-bold text-white hover:text-rbx-orange transition">{title}</h3>
                  </Link>
                  <p className="line-clamp-2 text-xs text-rbx-muted">{meta?.description || game.description}</p>
                  <div className="flex gap-3 text-xs text-rbx-muted">
                    <span>{formatStat(meta?.player_count)} playing</span>
                    <span>{formatStat(meta?.visits)} visits</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      aria-label={`Upvote ${title}`}
                      onClick={() => handleVote(game.id, 1)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        userVote?.value === 1 ? 'bg-rbx-orange text-white' : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                      }`}
                    >▲</button>
                    <button
                      type="button"
                      aria-label={`Downvote ${title}`}
                      onClick={() => handleVote(game.id, -1)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        userVote?.value === -1 ? 'bg-rbx-red text-white' : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                      }`}
                    >▼</button>
                    <a
                      href={game.roblox_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    >Play</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
