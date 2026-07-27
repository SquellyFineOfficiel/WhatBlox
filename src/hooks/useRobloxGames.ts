import { useEffect, useState, useCallback } from 'react';
import { searchRobloxGames, mapRobloxGameToWhatBlox, RobloxGameFilters } from '../lib/robloxApi';

export interface RobloxGame {
  id: string;
  title: string;
  genre: string;
  developer: string;
  players_now: number;
  total_visits: number;
  description: string;
  gradient_from: string;
  gradient_to: string;
  icon_name: string;
  roblox_url: string;
}

export function useRobloxGames(filters: RobloxGameFilters = {}) {
  const [games, setGames] = useState<RobloxGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchRobloxGames({
        ...filters,
        limit: filters.limit || 50,
        sortBy: filters.sortBy || 'Visits',
        sortOrder: filters.sortOrder || 'Desc',
      });

      const mappedGames = result.data.map(mapRobloxGameToWhatBlox);
      setGames(mappedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, refetch: fetchGames };
}