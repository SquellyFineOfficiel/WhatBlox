"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { calculateTrendingScore } from '@/src/lib/game-ranking';
import { formatStat, getRobloxGameMetadata, type RobloxMetadata } from '@/src/lib/roblox';
import AdBanner from '@/src/components/ad-banner';

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

type UserActivity = {
  games: { id: string; title: string }[];
  upvotesPerGame: Record<string, number>;
  recentReviews: { gameId: string; gameTitle: string; rating: number; reviewTitle: string; createdAt: string }[];
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return dateFormatter.format(new Date(dateStr));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-rbx-orange">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function Thumbnail({ title, thumbnailUrl }: { title: string; thumbnailUrl?: string | null }) {
  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        width={640}
        height={360}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rbx-surface-2 to-rbx-surface-3">
      <span className="text-xs font-black tracking-widest text-rbx-border">RBX</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-rbx-border/50 bg-rbx-surface animate-pulse">
      <div className="aspect-video bg-rbx-surface-2" />
      <div className="space-y-2.5 p-4">
        <div className="h-3.5 w-3/4 rounded-full bg-rbx-surface-2" />
        <div className="h-3 w-1/2 rounded-full bg-rbx-surface-2" />
        <div className="h-7 w-full rounded-full bg-rbx-surface-2" />
      </div>
    </div>
  );
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const c = document.cookie.split('; ').find(r => r.startsWith(`${name}=`));
  return c ? c.slice(name.length + 1) : null;
}

export default function HomePage({ user, isConfigured }: HomePageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const activeUser = user || clientUser;

  useEffect(() => {
    const name = getCookie('rbx_user_name');
    if (name) setUsername(decodeURIComponent(name));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setClientUser({ id: data.user.id });
    });

    async function loadGames() {
      if (!isConfigured) {
        setGames([]);
        setLoading(false);
        setStatusMessage('Live game data is unavailable until Supabase is configured.');
        return;
      }
      const client = createClient();
      if (!client) { setLoading(false); return; }

      const { data, error } = await client
        .from('games')
        .select('id,title,description,roblox_url,created_at,user_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error || !data) {
        setStatusMessage('Live data is temporarily unavailable. Please try again soon.');
        setLoading(false);
        return;
      }

      setGames(data as Game[]);
      if (activeUser?.id) {
        const { data: voteData } = await client.from('votes').select('id,game_id,value').eq('user_id', activeUser.id);
        setVotes(Object.fromEntries((voteData ?? []).map((v: Vote) => [v.game_id, v])));
      }
      setLoading(false);
    }

    loadGames();
  }, [isConfigured, activeUser?.id]);

  useEffect(() => {
    if (!activeUser?.id || !isConfigured) return;
    let ignore = false;

    const loadActivity = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data: userGames } = await supabase
        .from('games').select('id, title')
        .eq('user_id', activeUser.id).eq('status', 'approved')
        .order('created_at', { ascending: false }).limit(10);

      if (!userGames?.length || ignore) return;

      const gameIds = userGames.map(g => g.id);
      const gameMap = Object.fromEntries(userGames.map(g => [g.id, g.title]));

      const { data: votesData } = await supabase
        .from('votes').select('game_id').in('game_id', gameIds).eq('value', 1);

      const upvotesPerGame: Record<string, number> = {};
      for (const v of (votesData ?? []) as { game_id: string }[])
        upvotesPerGame[v.game_id] = (upvotesPerGame[v.game_id] ?? 0) + 1;

      let recentReviews: UserActivity['recentReviews'] = [];
      try {
        const { data: rd } = await supabase
          .from('reviews').select('game_id, rating, title, created_at')
          .in('game_id', gameIds).order('created_at', { ascending: false }).limit(6);
        recentReviews = ((rd ?? []) as { game_id: string; rating: number; title: string; created_at: string }[])
          .map(r => ({ gameId: r.game_id, gameTitle: gameMap[r.game_id] ?? '', rating: r.rating, reviewTitle: r.title, createdAt: r.created_at }));
      } catch { /* ignore */ }

      if (!ignore) setUserActivity({ games: userGames as { id: string; title: string }[], upvotesPerGame, recentReviews });
    };

    loadActivity();
    return () => { ignore = true; };
  }, [activeUser?.id, isConfigured]);

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
    if (!isConfigured || !activeUser) { setStatusMessage('Sign in to vote.'); return; }
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

  const trendingGames = useMemo(() =>
    [...games]
      .sort((a, b) => calculateTrendingScore(metadataMap[b.id], b.created_at) - calculateTrendingScore(metadataMap[a.id], a.created_at))
      .slice(0, 12),
    [games, metadataMap]
  );

  const recentGames = useMemo(() =>
    [...games].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8),
    [games]
  );

  const totalUpvotes = userActivity
    ? Object.values(userActivity.upvotesPerGame).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-4 pb-14 pt-6 sm:px-6 lg:px-8">

      {/* ── Personalised greeting ── */}
      {activeUser && username && (
        <section className="animate-fade-up overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Hey, <span className="bg-gradient-to-r from-rbx-red to-rbx-orange bg-clip-text text-transparent">{username}</span> 👋
              </h2>
              <p className="mt-0.5 text-sm text-rbx-muted">Here&apos;s what&apos;s happening with your games.</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-rbx-border bg-rbx-surface-2 px-4 py-2 text-xs font-bold text-white transition hover:border-white/20 hover:bg-rbx-surface-3"
            >
              Dashboard →
            </Link>
          </div>

          {userActivity ? (
            <>
              <div className="grid gap-px bg-rbx-border/40 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]">
                <div className="flex items-center gap-4 bg-rbx-surface px-6 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rbx-surface-2">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rbx-orange"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4M12 17v4"/></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-black tabular-nums text-white">{userActivity.games.length}</p>
                    <p className="text-xs text-rbx-muted">Published game{userActivity.games.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-rbx-surface px-6 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rbx-surface-2">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rbx-orange"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-black tabular-nums text-white">{totalUpvotes}</p>
                    <p className="text-xs text-rbx-muted">Total upvotes</p>
                  </div>
                </div>
                <div className="bg-rbx-surface px-6 py-5 sm:col-span-2 lg:col-span-1">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rbx-muted">Latest reviews</p>
                  {userActivity.recentReviews.length > 0 ? (
                    <ul className="space-y-2.5">
                      {userActivity.recentReviews.slice(0, 4).map((r, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <StarRating rating={r.rating} />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-xs font-semibold text-white">{r.reviewTitle || '(no title)'}</p>
                            <p className="text-[11px] text-rbx-muted">
                              on <Link href={`/game/${r.gameId}`} className="transition hover:text-white">{r.gameTitle}</Link>
                              {' · '}{timeAgo(r.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-rbx-muted">No reviews on your games yet.</p>
                  )}
                </div>
              </div>

              {userActivity.games.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-rbx-border/60 px-6 py-4">
                  {userActivity.games.slice(0, 5).map(g => (
                    <Link
                      key={g.id}
                      href={`/game/${g.id}`}
                      className="rounded-full border border-rbx-border bg-rbx-surface-2 px-3 py-1.5 text-xs font-medium text-rbx-muted transition hover:border-white/20 hover:text-white"
                    >
                      {g.title}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-px bg-rbx-border/40 sm:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-[76px] animate-pulse bg-rbx-surface" />)}
            </div>
          )}
        </section>
      )}

      {/* ── Status message ── */}
      {statusMessage && (
        <p className="animate-fade-in rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-rbx-muted">
          {statusMessage}
        </p>
      )}

      {/* ── Loading skeletons ── */}
      {loading ? (
        <section>
          <div className="mb-5 h-8 w-48 animate-pulse rounded-full bg-rbx-surface-2" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      ) : !games.length ? (
        <section className="animate-fade-up rounded-2xl border border-rbx-border bg-rbx-surface p-10 text-center">
          <p className="text-4xl">🎮</p>
          <h2 className="mt-4 text-2xl font-black text-white">Nothing here yet</h2>
          <p className="mt-2 text-sm text-rbx-muted">Be the first to share a Roblox experience with the world.</p>
          <Link
            href="/submit"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 hover:shadow-lg hover:shadow-rbx-orange/20"
          >
            Submit a game
          </Link>
        </section>
      ) : (
        <>
          {/* ── Trending ── */}
          <section className="animate-fade-up">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Trending now</h2>
                <p className="mt-0.5 text-sm text-rbx-muted">The most active games right now</p>
              </div>
              <Link href="/discovery" className="shrink-0 text-sm text-rbx-muted transition hover:text-white">
                See all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {trendingGames.map((game, index) => {
                const metadata = metadataMap[game.id];
                const title = metadata?.title || game.title;
                const userVote = votes[game.id];
                return (
                  <article
                    key={game.id}
                    className="group relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-xl hover:shadow-black/30"
                  >
                    <Link href={`/game/${game.id}`} className="block">
                      <div className="relative aspect-video overflow-hidden bg-rbx-surface-3">
                        <Thumbnail title={title} thumbnailUrl={metadata?.thumbnail_url} />
                        {/* Rank badge */}
                        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-black tabular-nums text-white ${
                          index === 0 ? 'bg-rbx-orange' : index === 1 ? 'bg-rbx-red' : 'bg-black/60'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/game/${game.id}`}>
                        <h3 className="line-clamp-1 text-sm font-bold text-white transition hover:text-rbx-orange">{title}</h3>
                      </Link>
                      <div className="mt-1.5 flex gap-3 text-xs text-rbx-muted">
                        <span className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                          {formatStat(metadata?.player_count)} playing
                        </span>
                        <span>{formatStat(metadata?.visits)} visits</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Upvote ${title}`}
                          onClick={() => handleVote(game.id, 1)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            userVote?.value === 1
                              ? 'bg-rbx-orange text-white shadow-md shadow-rbx-orange/20'
                              : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                          }`}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`Downvote ${title}`}
                          onClick={() => handleVote(game.id, -1)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            userVote?.value === -1
                              ? 'bg-rbx-red text-white'
                              : 'bg-rbx-surface-2 text-rbx-muted hover:text-white'
                          }`}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22L2 2h20L12 22z"/></svg>
                        </button>
                        <a
                          href={game.roblox_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90 hover:shadow-md hover:shadow-rbx-orange/20"
                        >
                          Play
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Ad — between Trending and Newest */}
          <AdBanner
            slot="7452109863"
            format="horizontal"
            className="rounded-2xl border border-rbx-border/50 bg-rbx-surface/40 p-2"
          />

          {/* ── Newest ── */}
          <section className="animate-fade-up-slow">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Newest submissions</h2>
                <p className="mt-0.5 text-sm text-rbx-muted">Fresh games waiting to be discovered</p>
              </div>
              <Link href="/discovery" className="shrink-0 text-sm text-rbx-muted transition hover:text-white">
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recentGames.map(game => {
                const metadata = metadataMap[game.id];
                const title = metadata?.title || game.title;
                return (
                  <Link
                    key={`${game.id}-recent`}
                    href={`/game/${game.id}`}
                    className="group overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-xl hover:shadow-black/30"
                  >
                    <div className="h-32 overflow-hidden bg-rbx-surface-3">
                      <Thumbnail title={title} thumbnailUrl={metadata?.thumbnail_url} />
                    </div>
                    <div className="space-y-1.5 p-3.5">
                      <p className="line-clamp-1 text-sm font-bold text-white group-hover:text-rbx-orange transition">{title}</p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-rbx-muted">{metadata?.description || game.description}</p>
                      <p className="text-[11px] text-rbx-muted/70">{dateFormatter.format(new Date(game.created_at))}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}