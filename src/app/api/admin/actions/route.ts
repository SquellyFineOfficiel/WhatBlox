import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

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

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, targetType, targetId, reason, expiresAt } = await req.json();

    if (!action || !targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: action,
      target_type: targetType,
      target_id: targetId,
      reason,
      metadata: { expiresAt },
    });

    // Execute action
    if (action === 'ban_game') {
      const { error } = await supabase.from('banned_games').insert({
        game_id: targetId,
        banned_by: user.id,
        reason,
        ban_expires_at: expiresAt || null,
      });
      if (error) throw error;
    } else if (action === 'unban_game') {
      const { error } = await supabase
        .from('banned_games')
        .delete()
        .eq('game_id', targetId);
      if (error) throw error;
    } else if (action === 'ban_user') {
      const { error } = await supabase.from('banned_users').insert({
        user_id: targetId,
        banned_by: user.id,
        reason,
        ban_expires_at: expiresAt || null,
      });
      if (error) throw error;
    } else if (action === 'unban_user') {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', targetId);
      if (error) throw error;
    } else if (action === 'delete_content') {
      if (targetType === 'comment') {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', targetId);
        if (error) throw error;
      } else if (targetType === 'review') {
        const { error } = await supabase
          .from('reviews')
          .delete()
          .eq('id', targetId);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error executing admin action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (type !== 'all') {
      query = query.eq('action_type', type);
    }

    const { data } = await query.limit(limit);

    return NextResponse.json({ actions: data || [] });
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
