import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id,display_name,avatar_url,bio')
      .eq('id', userId)
      .maybeSingle();

    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('id,title,description,roblox_url,created_at,user_id,tags')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (gamesError) {
      console.error('Profile games fetch error:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch profile games' }, { status: 500 });
    }

    const games = gamesData ?? [];
    const gameIds = games.map(g => g.id);

    let totalUpvotes = 0;
    if (gameIds.length > 0) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('game_id,value')
        .in('game_id', gameIds)
        .eq('value', 1);
      totalUpvotes = (votesData ?? []).length;
    }

    const profile = profileData ?? { id: userId, display_name: null, avatar_url: null, bio: null };

    return NextResponse.json({
      profile,
      games,
      stats: {
        totalGames: games.length,
        totalUpvotes,
      },
    });
  } catch (error) {
    console.error('Profile route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
