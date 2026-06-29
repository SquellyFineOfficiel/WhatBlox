import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const NOTIFICATION_RATE_LIMIT = 5; // Max 5 notifications per day
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

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

    const { gameId, title, message } = await req.json();

    if (!gameId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate title and message length
    if (title.length > 100 || message.length > 500) {
      return NextResponse.json({ error: 'Title or message too long' }, { status: 400 });
    }

    // Verify user owns the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('user_id')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.user_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this game' }, { status: 403 });
    }

    // Check rate limit
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('notification_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .gt('window_start', windowStart.toISOString())
      .single();

    if (!rateLimitError) {
      if (rateLimitData.notification_count >= NOTIFICATION_RATE_LIMIT) {
        return NextResponse.json(
          { error: `Rate limit exceeded. Max ${NOTIFICATION_RATE_LIMIT} notifications per 24 hours` },
          { status: 429 }
        );
      }

      // Increment count
      await supabase
        .from('notification_rate_limits')
        .update({ notification_count: rateLimitData.notification_count + 1 })
        .eq('id', rateLimitData.id);
    } else if (rateLimitError.code === 'PGRST116') {
      // No existing rate limit record, create one
      await supabase
        .from('notification_rate_limits')
        .insert({ user_id: user.id, notification_count: 1, window_start: now.toISOString() });
    }

    // Get all followers of the game
    const { data: followers, error: followersError } = await supabase
      .from('game_followers')
      .select('user_id')
      .eq('game_id', gameId);

    if (followersError) {
      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }

    if (!followers || followers.length === 0) {
      return NextResponse.json({
        success: true,
        notificationCount: 0,
        message: 'No followers to notify',
      });
    }

    // Create notifications for all followers
    const notifications = followers.map((follower) => ({
      user_id: follower.user_id,
      type: 'game_update',
      related_game_id: gameId,
      related_user_id: user.id,
      title,
      message,
      action_url: `/game/${gameId}`,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }

    // Track sent notification
    await supabase
      .from('developer_notifications')
      .insert({
        game_id: gameId,
        creator_id: user.id,
        title,
        message,
        notification_count: followers.length,
      });

    return NextResponse.json({
      success: true,
      notificationCount: followers.length,
      message: `Notification sent to ${followers.length} follower${followers.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
