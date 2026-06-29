import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const NOTIFICATIONS_PER_PAGE = 15;

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
    const page = parseInt(searchParams.get('page') || '1');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const from = (page - 1) * NOTIFICATIONS_PER_PAGE;
    const to = from + NOTIFICATIONS_PER_PAGE - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / NOTIFICATIONS_PER_PAGE),
        totalResults: count || 0,
      },
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    const { notificationIds, action } = await req.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Missing notificationIds' }, { status: 400 });
    }

    if (action === 'mark_read') {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('id', notificationIds);

      if (error) {
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else if (action === 'delete') {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .in('id', notificationIds);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
