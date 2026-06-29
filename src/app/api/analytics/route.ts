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

    // Verify ownership
    const { data: game } = await supabase
      .from('games')
      .select('id, user_id')
      .eq('id', gameId)
      .single();

    if (!game || game.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch analytics
    const { data: analytics } = await supabase
      .from('game_analytics')
      .select('*')
      .eq('game_id', gameId)
      .single();

    // Fetch last 30 days of daily analytics
    const { data: dailyAnalytics } = await supabase
      .from('game_analytics_daily')
      .select('*')
      .eq('game_id', gameId)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      analytics,
      dailyAnalytics: dailyAnalytics || [],
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
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

    const { gameId, eventType } = await req.json();

    if (!gameId || !eventType) {
      return NextResponse.json({ error: 'Missing gameId or eventType' }, { status: 400 });
    }

    // Verify game exists
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Track page view
    if (eventType === 'view') {
      await supabase.from('page_views').insert({
        game_id: gameId,
        user_id: user.id,
      });
    }

    // Update analytics based on event type
    const { data: analytics } = await supabase
      .from('game_analytics')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (analytics) {
      const updates: any = { updated_at: new Date().toISOString() };

      switch (eventType) {
        case 'view':
          updates.total_views = (analytics.total_views || 0) + 1;
          break;
        case 'click':
          updates.total_clicks = (analytics.total_clicks || 0) + 1;
          break;
        case 'wishlist_add':
          updates.total_wishlist_adds = (analytics.total_wishlist_adds || 0) + 1;
          break;
        case 'comment_add':
          updates.total_comments = (analytics.total_comments || 0) + 1;
          break;
        case 'review_add':
          updates.total_reviews = (analytics.total_reviews || 0) + 1;
          break;
      }

      await supabase
        .from('game_analytics')
        .update(updates)
        .eq('game_id', gameId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
