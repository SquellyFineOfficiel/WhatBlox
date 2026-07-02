import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type GameRow = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
  status: string;
  tags: string[] | null;
};

type VoteAgg = { up: number; down: number; score: number };

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'trending';
    const tag = searchParams.get('tag');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { data: [], pagination: { page, totalPages: 0, total: 0 }, voteCounts: {} },
        { status: 200 }
      );
    }

    let baseQuery = supabase
      .from('games')
      .select('id,title,description,roblox_url,created_at,user_id,status,tags', { count: 'exact' })
      .eq('status', 'approved');

    if (tag) {
      baseQuery = baseQuery.contains('tags', [tag]);
    }

    // For "newest" we can paginate directly in SQL. For "top"/"trending" we need
    // vote scores computed across the filtered set first, so fetch all matching
    // rows (bounded) and paginate in-memory.
    if (sort === 'newest') {
      const offset = (page - 1) * limit;
      const { data, error, count } = await baseQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Games fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
      }

      const games = (data ?? []) as GameRow[];
      const voteCounts = await getVoteCounts(supabase, games.map(g => g.id));
      const total = count ?? games.length;

      return NextResponse.json({
        data: games,
        pagination: { page, totalPages: Math.max(1, Math.ceil(total / limit)), total },
        voteCounts,
      });
    }

    // top / trending: fetch full matching set (capped) to compute scores
    const { data: allData, error: allError } = await baseQuery.order('created_at', { ascending: false }).limit(1000);

    if (allError) {
      console.error('Games fetch error:', allError);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    const allGames = (allData ?? []) as GameRow[];
    const voteCounts = await getVoteCounts(supabase, allGames.map(g => g.id));

    const now = Date.now();
    const scored = allGames.map(game => {
      const votes = voteCounts[game.id] ?? { up: 0, down: 0, score: 0 };
      const ageInDays = (now - new Date(game.created_at).getTime()) / MS_PER_DAY;
      const isRecent = ageInDays <= 7;
      const boost = sort === 'trending' && isRecent ? 1.5 : 1;
      return { game, rank: votes.score * boost };
    });

    scored.sort((a, b) => b.rank - a.rank || new Date(b.game.created_at).getTime() - new Date(a.game.created_at).getTime());

    const total = scored.length;
    const offset = (page - 1) * limit;
    const pageGames = scored.slice(offset, offset + limit).map(s => s.game);

    return NextResponse.json({
      data: pageGames,
      pagination: { page, totalPages: Math.max(1, Math.ceil(total / limit)), total },
      voteCounts,
    });
  } catch (error) {
    console.error('Games route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getVoteCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameIds: string[]
): Promise<Record<string, VoteAgg>> {
  const result: Record<string, VoteAgg> = {};
  if (!supabase || gameIds.length === 0) return result;

  const { data, error } = await supabase
    .from('votes')
    .select('game_id,value')
    .in('game_id', gameIds);

  if (error || !data) return result;

  for (const row of data as { game_id: string; value: number }[]) {
    if (!result[row.game_id]) result[row.game_id] = { up: 0, down: 0, score: 0 };
    if (row.value > 0) result[row.game_id].up += 1;
    else if (row.value < 0) result[row.game_id].down += 1;
    result[row.game_id].score = result[row.game_id].up - result[row.game_id].down;
  }

  return result;
}
