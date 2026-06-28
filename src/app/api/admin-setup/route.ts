import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/src/lib/auth-server';
import { createAdminClient } from '@/src/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { error } = await adminClient.from('admin_users').insert({
      id: user.id,
      role: 'super_admin',
      permissions: ['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins'],
    });

    if (error) {
      // If user already exists, update instead
      if (error.code === '23505') {
        const { error: updateError } = await adminClient
          .from('admin_users')
          .update({
            role: 'super_admin',
            permissions: ['review', 'ban_users', 'ban_games', 'view_analytics', 'view_logs', 'review_appeals', 'manage_admins'],
          })
          .eq('id', user.id);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Admin status updated!' });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'You are now a super admin!' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
