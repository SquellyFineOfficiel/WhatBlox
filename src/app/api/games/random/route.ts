import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '9', 10), 50);

    const supabase = await createClient();
    if (!supabase) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: allGames, error } = await supabase
      .from('games')
      .select('id,title,description,roblox_url,created_at,user_id')
      .eq('status', 'approved');

    if (error || !allGames || allGames.length === 0) {
      return Response.json(
        { error: 'No games found or database error' },
        { status: 404 }
      );
    }

    // Fisher-Yates shuffle algorithm
    const shuffled = [...allGames];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const randomGames = shuffled.slice(0, limit);

    return Response.json({ data: randomGames });
  } catch (error) {
    console.error('Error fetching random games:', error);
    return Response.json(
      { error: 'Failed to fetch random games' },
      { status: 500 }
    );
  }
}
