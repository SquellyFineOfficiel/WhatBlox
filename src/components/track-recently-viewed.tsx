'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'whatblox_recently_viewed';
const MAX_ITEMS = 20;

type RecentlyViewedItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  visitedAt: string;
};

export default function TrackRecentlyViewed({
  gameId,
  title,
  thumbnailUrl,
}: {
  gameId: string;
  title: string;
  thumbnailUrl?: string | null;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const existing: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
      const deduped = existing.filter(item => item.id !== gameId);
      const next: RecentlyViewedItem[] = [
        { id: gameId, title, thumbnailUrl: thumbnailUrl ?? null, visitedAt: new Date().toISOString() },
        ...deduped,
      ].slice(0, MAX_ITEMS);

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (private browsing, etc.) — fail silently.
    }
  }, [gameId, title, thumbnailUrl]);

  return null;
}
