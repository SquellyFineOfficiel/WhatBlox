"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import { formatStat, getRobloxGameMetadata } from '@/src/lib/roblox';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

type Game = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
  reviewer_message: string | null;
};

type GameMetadata = {
  thumbnail_url?: string;
  player_count?: number;
  visits?: number;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function ReviewPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AdminRole>('reviewer');
  const [metadataMap, setMetadataMap] = useState<Record<string, GameMetadata>>({});
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'title'>('oldest');
  const [rejectReason, setRejectReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [activeActionGameId, setActiveActionGameId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const clientUser = getClientUser();
        if (clientUser) {
          const { data: admin, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', clientUser.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching admin role:', error);
          } else if (admin) {
            setUserRole(admin.role as AdminRole);
          }
        }

        const { data } = await supabase
          .from('games')
          .select('id,title,description,roblox_url,created_at,user_id,reviewer_message')
          .eq('status', 'review')
          .order('created_at', { ascending: true });

        if (data) {
          setGames(data as Game[]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async (gameList: Game[]) => {
      if (gameList.length === 0) {
        setMetadataMap({});
        return;
      }

      const pairs = await Promise.all(
        gameList.map(async (game) => {
          const info = await getRobloxGameMetadata(game.roblox_url);
          return [game.id, info as GameMetadata] as const;
        }),
      );

      if (!cancelled) {
        setMetadataMap(Object.fromEntries(pairs));
      }
    };

    loadMetadata(games);

    return () => {
      cancelled = true;
    };
  }, [games]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const base = normalizedQuery
      ? games.filter((game) => (
          game.title.toLowerCase().includes(normalizedQuery) ||
          game.description.toLowerCase().includes(normalizedQuery) ||
          game.user_id.toLowerCase().includes(normalizedQuery)
        ))
      : games;

    const copy = [...base];
    if (sortBy === 'newest') {
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'title') {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return copy;
  }, [games, searchQuery, sortBy]);

  useEffect(() => {
    if (filteredGames.length === 0) {
      setSelectedGame(null);
      return;
    }

    setSelectedGame((prev) => {
      if (!prev) return filteredGames[0];
      const stillVisible = filteredGames.find((game) => game.id === prev.id);
      return stillVisible ?? filteredGames[0];
    });
  }, [filteredGames]);

  const handleApprove = async (gameId: string) => {
    const supabase = createClient();
    if (!supabase) return;

    setActiveActionGameId(gameId);
    setActionMessage('Approving...');
    const { error } = await supabase
      .from('games')
      .update({ status: 'approved' })
      .eq('id', gameId);

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setGames((prev) => prev.filter((game) => game.id !== gameId));
      setSelectedGame(null);
      setRejectReason('');
      setActionMessage('Game approved.');
      setTimeout(() => setActionMessage(''), 2000);
    }
    setActiveActionGameId(null);
  };

  const handleReject = async (gameId: string, reason: string) => {
    const supabase = createClient();
    if (!supabase) return;
    if (!reason.trim()) {
      setActionMessage('Please provide a rejection reason.');
      return;
    }

    setActiveActionGameId(gameId);
    setActionMessage('Rejecting...');
    const { error } = await supabase
      .from('games')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', gameId);

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setGames((prev) => prev.filter((game) => game.id !== gameId));
      setSelectedGame(null);
      setRejectReason('');
      setActionMessage('Game rejected.');
      setTimeout(() => setActionMessage(''), 2000);
    }
    setActiveActionGameId(null);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-6 sm:p-8">
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
              Review queue
            </span>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Moderate submissions faster</h1>
                <p className="mt-2 text-sm text-rbx-muted sm:text-base">Select a game, review key metrics, and take action without leaving this page.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-rbx-muted">In queue</p>
                  <p className="mt-1 text-lg font-black text-white">{games.length}</p>
                </div>
                <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-rbx-muted">Showing</p>
                  <p className="mt-1 text-lg font-black text-white">{filteredGames.length}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 sm:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-rbx-muted">Selected</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">{selectedGame?.title ?? 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
              <p className="text-lg font-bold text-white">All caught up.</p>
              <p className="mt-2 text-rbx-muted">No games pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label htmlFor="review-search" className="sr-only">Search review queue</label>
                  <input
                    id="review-search"
                    type="text"
                    name="reviewSearch"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by game title, description, or submitter ID..."
                    className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-2.5 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
                  />
                  <label htmlFor="review-sort" className="sr-only">Sort queue</label>
                  <select
                    id="review-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as 'oldest' | 'newest' | 'title')}
                    className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2.5 text-sm text-white focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
                  >
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
              </div>

              {filteredGames.length === 0 ? (
                <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
                  <p className="text-lg font-bold text-white">No matching games</p>
                  <p className="mt-2 text-rbx-muted">Try a different search or sort option.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGames.map((game) => {
                    const info = metadataMap[game.id];
                    const isSelected = selectedGame?.id === game.id;
                    const isActing = activeActionGameId === game.id;
                    return (
                      <button
                        type="button"
                        key={game.id}
                        onClick={() => setSelectedGame(game)}
                        className={`w-full rounded-2xl border text-left transition ${
                          isSelected
                            ? 'border-rbx-orange bg-rbx-surface-2'
                            : 'border-rbx-border bg-rbx-surface hover:border-rbx-orange/50 hover:bg-rbx-surface-2'
                        }`}
                      >
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                          {info?.thumbnail_url ? (
                            <img
                              src={info.thumbnail_url}
                              alt={game.title}
                              width={160}
                              height={96}
                              className="h-28 w-full rounded-xl object-cover sm:w-40"
                            />
                          ) : (
                            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-rbx-surface-3 text-xs text-rbx-muted sm:w-40">
                              No thumbnail
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h2 className="truncate text-lg font-bold text-white">{game.title}</h2>
                              <span className="rounded-lg border border-rbx-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rbx-muted">
                                Submitted {dateFormatter.format(new Date(game.created_at))}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-rbx-muted">{game.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-lg bg-rbx-surface-3 px-2 py-1 text-rbx-muted">
                                Players {formatStat(info?.player_count)}
                              </span>
                              <span className="rounded-lg bg-rbx-surface-3 px-2 py-1 text-rbx-muted">
                                Visits {formatStat(info?.visits)}
                              </span>
                              <span className="rounded-lg bg-rbx-surface-3 px-2 py-1 text-rbx-muted">
                                Submitter {game.user_id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a
                                href={game.roblox_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-rbx-border px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/20"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Open Roblox
                              </a>
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleApprove(game.id);
                                }}
                                className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-300 transition hover:bg-green-500/20 disabled:opacity-60"
                              >
                                {isActing ? 'Working...' : 'Quick approve'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AdminSidebar currentPage="review" userRole={userRole} />

          <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <h3 className="text-lg font-black text-white">Decision panel</h3>
            {!selectedGame ? (
              <p className="mt-3 text-sm text-rbx-muted">Select a game to approve or reject it.</p>
            ) : (
              <>
                <div className="mt-4 space-y-3 text-sm text-rbx-muted">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-rbx-muted">Selected game</p>
                    <p className="mt-1 text-base font-bold text-white">{selectedGame.title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-rbx-muted">Submitter message</p>
                    <p className="mt-1 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm text-white">
                      {selectedGame.reviewer_message?.trim() ? selectedGame.reviewer_message : 'No message provided.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    disabled={activeActionGameId === selectedGame.id}
                    onClick={() => handleApprove(selectedGame.id)}
                    className="w-full rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2.5 text-sm font-bold text-green-300 transition hover:bg-green-500/20 disabled:opacity-60"
                  >
                    {activeActionGameId === selectedGame.id ? 'Applying...' : 'Approve game'}
                  </button>

                  <label htmlFor="rejection-reason" className="block text-sm font-semibold text-white">
                    Rejection reason
                  </label>
                  <textarea
                    id="rejection-reason"
                    name="rejectionReason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Explain why this game is being rejected..."
                    rows={4}
                    className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-red"
                  />
                  <button
                    type="button"
                    disabled={activeActionGameId === selectedGame.id || !rejectReason.trim()}
                    onClick={() => handleReject(selectedGame.id, rejectReason.trim())}
                    className="w-full rounded-xl border border-rbx-red/40 bg-rbx-red/10 px-4 py-2.5 text-sm font-bold text-rbx-red transition hover:bg-rbx-red/20 disabled:opacity-60"
                  >
                    Reject game
                  </button>
                </div>

                {actionMessage && (
                  <p aria-live="polite" className="mt-4 text-sm text-rbx-muted">{actionMessage}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
