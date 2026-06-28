import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { getServerUser } from '@/src/lib/auth-server';
import { isAdminServerUser } from '@/src/lib/profile';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const user = await getServerUser();
  if (!user || !(await isAdminServerUser(user.id))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  await supabase.from('games').update({ status: 'approved', rejection_reason: null }).eq('id', id);
  return NextResponse.redirect(new URL('/admin/queue', request.url));
}