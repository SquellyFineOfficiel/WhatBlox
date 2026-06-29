'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

export default function FollowGameButton({ gameId }: { gameId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user ? { id: user.id } : null);
    };

    checkUser();
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/games/followers?gameId=${gameId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setFollowerCount(data.followerCount);
        }
      } catch (err) {
        console.error('Error fetching follow status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [gameId, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/games/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          action: isFollowing ? 'unfollow' : 'follow',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(!isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <button
        onClick={handleToggleFollow}
        className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-6 py-3 text-sm font-bold text-rbx-muted transition hover:text-white hover:border-rbx-orange/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange"
      >
        👁️ Follow
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      title={`${followerCount} people following this game`}
      className={`rounded-lg border px-6 py-3 text-sm font-bold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange disabled:opacity-50 ${
        isFollowing
          ? 'border-rbx-orange/50 bg-rbx-orange/10 text-rbx-orange hover:bg-rbx-orange/20'
          : 'border-rbx-border bg-rbx-surface-2 text-rbx-muted hover:text-white hover:border-rbx-orange/50'
      }`}
    >
      {isFollowing ? '👁️ Following' : '👁️ Follow'} ({followerCount})
    </button>
  );
}
