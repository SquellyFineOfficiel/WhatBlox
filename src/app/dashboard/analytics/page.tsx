'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

type Analytics = {
  id: string;
  game_id: string;
  total_views: number;
  total_clicks: number;
  total_wishlist_adds: number;
  total_comments: number;
  total_reviews: number;
  average_rating: number;
  total_plays_today: number;
  total_plays_week: number;
  total_plays_month: number;
  updated_at: string;
};

type DailyAnalytic = {
  date: string;
  views: number;
  clicks: number;
  wishlist_adds: number;
  comments_added: number;
  reviews_added: number;
};

type GameWithAnalytics = {
  id: string;
  title: string;
  analytics: Analytics | null;
};

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [games, setGames] = useState<GameWithAnalytics[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytic[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({ id: data.user.id });
      } else {
        router.push('/auth');
      }
    });
  }, [router]);

  // Load user's games
  useEffect(() => {
    if (!currentUser) return;

    const loadGames = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data } = await supabase
        .from('games')
        .select('id, title')
        .eq('user_id', currentUser.id);

      if (data) {
        setGames(data.map((g) => ({ ...g, analytics: null })));
        if (data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      }
      setLoading(false);
    };

    loadGames();
  }, [currentUser]);

  // Load analytics for selected game
  useEffect(() => {
    if (!selectedGameId) return;

    const loadAnalytics = async () => {
      try {
        const url = new URL('/api/analytics', window.location.origin);
        url.searchParams.set('gameId', selectedGameId);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
          setDailyAnalytics(data.dailyAnalytics);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
    };

    loadAnalytics();
  }, [selectedGameId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-rbx-muted">Loading analytics...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (games.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-rbx-border bg-rbx-surface p-8 text-center">
          <h2 className="text-lg font-bold text-white">No Games Yet</h2>
          <p className="mt-2 text-sm text-rbx-muted">Submit a game to view analytics</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">Game Analytics</h1>
        <p className="mt-2 text-rbx-muted">Track your game's performance and engagement</p>
      </div>

      {/* Game Selection */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGameId(game.id)}
            className={`rounded-lg border p-4 text-left transition ${
              selectedGameId === game.id
                ? 'border-rbx-orange bg-rbx-surface-2'
                : 'border-rbx-border bg-rbx-surface hover:border-rbx-orange/50'
            }`}
          >
            <h3 className="font-bold text-white">{game.title}</h3>
          </button>
        ))}
      </div>

      {/* Analytics Stats */}
      {analytics && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <p className="text-sm text-rbx-muted">Total Views</p>
              <p className="mt-2 text-3xl font-black text-white">{analytics.total_views}</p>
            </div>
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <p className="text-sm text-rbx-muted">Play Button Clicks</p>
              <p className="mt-2 text-3xl font-black text-white">{analytics.total_clicks}</p>
            </div>
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <p className="text-sm text-rbx-muted">Wishlist Adds</p>
              <p className="mt-2 text-3xl font-black text-white">{analytics.total_wishlist_adds}</p>
            </div>
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <p className="text-sm text-rbx-muted">Comments</p>
              <p className="mt-2 text-3xl font-black text-white">{analytics.total_comments}</p>
            </div>
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <p className="text-sm text-rbx-muted">Reviews</p>
              <p className="mt-2 text-3xl font-black text-white">{analytics.total_reviews}</p>
            </div>
          </div>

          {/* Trend Chart (simplified) */}
          {dailyAnalytics.length > 0 && (
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
              <h2 className="text-lg font-bold text-white">30-Day Trend</h2>
              <div className="mt-6 flex items-end gap-1 h-64">
                {dailyAnalytics.map((day, idx) => {
                  const maxViews = Math.max(...dailyAnalytics.map((d) => d.views || 1), 1);
                  const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t bg-gradient-to-t from-rbx-red to-rbx-orange transition hover:opacity-75"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                      title={`${day.date}: ${day.views} views`}
                    />
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-rbx-muted text-center">Views over the last 30 days</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
