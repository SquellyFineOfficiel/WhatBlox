import { NextResponse, NextRequest } from 'next/server';
import { getVerifiedServerUser } from '@/src/lib/auth-session';
import { createClient } from '@/src/lib/supabase/server';

export async function GET() {
  try {
    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get notification preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        notifications_enabled: profile?.notifications_enabled ?? true,
      },
    });
  } catch (error) {
    console.error('Auth user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { notifications_enabled } = body;

    if (typeof notifications_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid notifications_enabled value' },
        { status: 400 }
      );
    }

    // Update user profile with notification preference
    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating notification preference:', error);
      return NextResponse.json(
        { error: 'Failed to update notification preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications_enabled,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
