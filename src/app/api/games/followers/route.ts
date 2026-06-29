import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    // Check if user follows this game
    const { data: follower, error } = await supabase
      .from('game_followers')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
    }

    // Get follower count
    const { count } = await supabase
      .from('game_followers')
      .select('*', { count: 'exact' })
      .eq('game_id', gameId);

    return NextResponse.json({
      isFollowing: !!follower,
      followerCount: count || 0,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId, action } = await req.json();

    if (!gameId || !action) {
      return NextResponse.json({ error: 'Missing gameId or action' }, { status: 400 });
    }

    // Verify game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (action === 'follow') {
      const { error } = await supabase
        .from('game_followers')
        .insert({ user_id: user.id, game_id: gameId });

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Already following this game' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to follow game' }, { status: 500 });
      }
    } else if (action === 'unfollow') {
      const { error } = await supabase
        .from('game_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      if (error) {
        return NextResponse.json({ error: 'Failed to unfollow game' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get updated follower count
    const { count } = await supabase
      .from('game_followers')
      .select('*', { count: 'exact' })
      .eq('game_id', gameId);

    return NextResponse.json({
      success: true,
      followerCount: count || 0,
    });
  } catch (error) {
    console.error('Error updating follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
