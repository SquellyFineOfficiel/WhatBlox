import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

export function useGames() {
  const [games, setGames] = useState<RobloxGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .order('players_now', { ascending: false });

      if (fetchError) throw fetchError;
      
      setGames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, refetch: fetchGames };
}