import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ prevId: null, nextId: null });
    }

    const { data: current } = await supabase
      .from('games')
      .select('id,created_at')
      .eq('id', id)
      .single();

    if (!current) {
      return NextResponse.json({ prevId: null, nextId: null });
    }

    // List is conceptually sorted newest-first. "Prev" = the next-newer game,
    // "Next" = the next-older game relative to the current one.
    const [{ data: newer }, { data: older }] = await Promise.all([
      supabase
        .from('games')
        .select('id')
        .eq('status', 'approved')
        .gt('created_at', current.created_at)
        .order('created_at', { ascending: true })
        .limit(1),
      supabase
        .from('games')
        .select('id')
        .eq('status', 'approved')
        .lt('created_at', current.created_at)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const prevId = (newer ?? [])[0]?.id ?? null;
    const nextId = (older ?? [])[0]?.id ?? null;

    return NextResponse.json({ prevId, nextId });
  } catch (error) {
    console.error('Adjacent games error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
