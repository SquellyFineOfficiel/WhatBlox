"use client";

import { useEffect, useState } from 'react';
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

export default function ReviewPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AdminRole>('reviewer');
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Get current user's Roblox ID from cookies
        const clientUser = getClientUser();
        if (clientUser) {
          // Query admin_users with the Roblox ID
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
    const loadMetadata = async () => {
      const metadata: Record<string, any> = {};
      for (const game of games) {
        const info = await getRobloxGameMetadata(game.roblox_url);
        metadata[game.id] = info;
      }
      setMetadataMap(metadata);
    };

    if (games.length > 0) {
      loadMetadata();
    }
  }, [games]);

  const handleApprove = async (gameId: string) => {
    const supabase = createClient();
    if (!supabase) return;

    setActionMessage('Approving...');
    const { error } = await supabase
      .from('games')
      .update({ status: 'approved' })
      .eq('id', gameId);

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setGames(games.filter((g) => g.id !== gameId));
      setSelectedGame(null);
      setActionMessage('Game approved! ✓');
      setTimeout(() => setActionMessage(''), 2000);
    }
  };

  const handleReject = async (gameId: string, reason: string) => {
    const supabase = createClient();
    if (!supabase) return;

    setActionMessage('Rejecting...');
    const { error } = await supabase
      .from('games')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', gameId);

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setGames(games.filter((g) => g.id !== gameId));
      setSelectedGame(null);
      setActionMessage('Game rejected.');
      setTimeout(() => setActionMessage(''), 2000);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Review Games</h1>
            <p className="mt-2 text-rbx-muted">Approve or reject pending game submissions</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
              <p className="text-lg font-bold text-white">All caught up! 🎉</p>
              <p className="mt-2 text-rbx-muted">No games pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                const info = metadataMap[game.id];
                return (
                  <article
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`cursor-pointer rounded-2xl border transition ${
                      selectedGame?.id === game.id
                        ? 'border-rbx-orange bg-rbx-surface-2'
                        : 'border-rbx-border bg-rbx-surface hover:border-rbx-orange/50 hover:bg-rbx-surface-2'
                    }`}
                  >
                    <div className="flex gap-4 p-6">
                      {info?.thumbnail_url ? (
                        <img
                          src={info.thumbnail_url}
                          alt={game.title}
                          className="h-24 w-32 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-24 w-32 rounded-lg bg-rbx-surface-3 flex items-center justify-center text-xs text-rbx-muted">
                          No image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">{game.title}</h3>
                        <p className="mt-1 text-sm text-rbx-muted line-clamp-2">{game.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-lg bg-rbx-surface-3 px-2 py-1 text-rbx-muted">
                            👥 {formatStat(info?.player_count)}
                          </span>
                          <span className="rounded-lg bg-rbx-surface-3 px-2 py-1 text-rbx-muted">
                            🎮 {formatStat(info?.visits)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <AdminSidebar currentPage="review" userRole={userRole} />

          {selectedGame && (
            <div className="mt-8 rounded-2xl border border-rbx-border bg-rbx-surface p-6">
              <h3 className="font-bold text-white mb-4">Game Details</h3>
              <div className="space-y-3 text-sm text-rbx-muted mb-6">
                <div>
                  <p className="text-xs text-rbx-muted/70 mb-1">Title</p>
                  <p className="text-white font-semibold">{selectedGame.title}</p>
                </div>
                {selectedGame.reviewer_message && (
                  <div>
                    <p className="text-xs text-rbx-muted/70 mb-1">Submitter's Message</p>
                    <p className="text-white text-sm italic">{selectedGame.reviewer_message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleApprove(selectedGame.id)}
                  className="w-full rounded-lg bg-green-600/20 border border-green-600/50 px-4 py-2 text-sm font-bold text-green-400 hover:bg-green-600/30 transition"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason:');
                    if (reason) {
                      handleReject(selectedGame.id, reason);
                    }
                  }}
                  className="w-full rounded-lg bg-rbx-red/20 border border-rbx-red/50 px-4 py-2 text-sm font-bold text-rbx-red hover:bg-rbx-red/30 transition"
                >
                  ✗ Reject
                </button>
              </div>

              {actionMessage && (
                <p className="mt-4 text-center text-sm text-rbx-muted">{actionMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
