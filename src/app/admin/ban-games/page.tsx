"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import { getRobloxGameMetadata } from '@/src/lib/roblox';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

type Game = {
  id: string;
  title: string;
  roblox_url: string;
  banned_at: string | null;
  ban_reason: string | null;
};

export default function BanGamesPage() {
  const [userRole, setUserRole] = useState<AdminRole>('moderator');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [robloxUrl, setRobloxUrl] = useState('');
  const [banReason, setBanReason] = useState('');
  const [message, setMessage] = useState('');
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        // Get current user's Roblox ID from cookies
        const clientUser = getClientUser();
        if (clientUser) {
          // Query admin_users with the Roblox ID
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', clientUser.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching admin role:', error);
          } else if (adminUser) {
            setUserRole(adminUser.role as AdminRole);
          }
        }

        const { data } = await supabase
          .from('games')
          .select('id,title,roblox_url,banned_at,ban_reason')
          .not('banned_at', 'is', null)
          .order('banned_at', { ascending: false });

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

  const handleBanGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robloxUrl.trim() || !banReason.trim()) {
      setMessage('Please fill in all fields');
      return;
    }

    setMessage('Banning game…');
    const supabase = createClient();
    if (!supabase) return;

    const { data: existingGame } = await supabase.from('games').select('id').eq('roblox_url', robloxUrl).single();

    if (!existingGame) {
      setMessage('Game not found');
      return;
    }

    const { error } = await supabase
      .from('games')
      .update({ banned_at: new Date().toISOString(), ban_reason: banReason })
      .eq('id', existingGame.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setRobloxUrl('');
      setBanReason('');
      setMessage('✓ Game banned successfully');
      
      // Add the newly banned game to the list
      if (existingGame?.id) {
        setGames([
          {
            id: existingGame.id,
            title: '',
            roblox_url: robloxUrl,
            banned_at: new Date().toISOString(),
            ban_reason: banReason,
          },
          ...games,
        ]);
      }
      
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Ban Games</h1>
            <p className="mt-2 text-rbx-muted">Remove inappropriate games from the platform</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <form onSubmit={handleBanGame} className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
              <h2 className="text-lg font-bold text-white mb-6">Ban a Game</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="ban-game-url" className="block text-sm font-bold text-white mb-2">Roblox URL *</label>
                  <input
                    id="ban-game-url"
                    type="url"
                    name="robloxUrl"
                    autoComplete="off"
                    value={robloxUrl}
                    onChange={(e) => setRobloxUrl(e.target.value)}
                    placeholder="https://www.roblox.com/games/…"
                    className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
                  />
                </div>

                <div>
                  <label htmlFor="ban-game-reason" className="block text-sm font-bold text-white mb-2">Ban Reason *</label>
                  <textarea
                    id="ban-game-reason"
                    name="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Explain why this game is being banned…"
                    rows={4}
                    className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  🎮 Ban Game
                </button>
              </div>

              {message && (
                <p className={`mt-6 text-center text-sm ${message.includes('Error') ? 'text-rbx-red' : 'text-green-400'}`}>
                  {message}
                </p>
              )}
            </form>

            <div>
              <h2 className="text-lg font-bold text-white mb-6">Recently Banned</h2>
              {loading ? (
                <p className="text-rbx-muted">Loading…</p>
              ) : games.length === 0 ? (
                <p className="text-rbx-muted">No banned games yet</p>
              ) : (
                <div className="space-y-3">
                  {games.slice(0, 5).map((game) => (
                    <div key={game.id} className="rounded-lg bg-rbx-surface-2 border border-rbx-border/50 p-3">
                      <p className="font-semibold text-white text-sm truncate">{game.title}</p>
                      <p className="mt-1 text-xs text-rbx-muted">{game.ban_reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <AdminSidebar currentPage="ban-games" userRole={userRole} />
      </div>
    </main>
  );
}
