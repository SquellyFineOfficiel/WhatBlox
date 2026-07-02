import { createClient } from '@/src/lib/supabase/server';
import { getVerifiedServerUser } from '@/src/lib/auth-session';
import { NextRequest, NextResponse } from 'next/server';

type VoteRow = { id: string; game_id: string; user_id: string; value: number };

async function computeScore(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, gameId: string) {
  const { data } = await supabase.from('votes').select('value').eq('game_id', gameId);
  const values = (data ?? []) as { value: number }[];
  return values.reduce((sum, v) => sum + v.value, 0);
}

export async function GET(request: NextRequest) {
  try {
    const gameIdsParam = request.nextUrl.searchParams.get('gameIds');
    if (!gameIdsParam) {
      return NextResponse.json({ error: 'gameIds is required' }, { status: 400 });
    }

    const gameIds = gameIdsParam.split(',').map(id => id.trim()).filter(Boolean);
    if (gameIds.length === 0) {
      return NextResponse.json({ voteCounts: {} });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ voteCounts: {} });
    }

    const { data, error } = await supabase.from('votes').select('game_id,value').in('game_id', gameIds);
    if (error) {
      console.error('Votes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    const voteCounts: Record<string, { up: number; down: number; score: number }> = {};
    for (const row of (data ?? []) as { game_id: string; value: number }[]) {
      if (!voteCounts[row.game_id]) voteCounts[row.game_id] = { up: 0, down: 0, score: 0 };
      if (row.value > 0) voteCounts[row.game_id].up += 1;
      else if (row.value < 0) voteCounts[row.game_id].down += 1;
      voteCounts[row.game_id].score = voteCounts[row.game_id].up - voteCounts[row.game_id].down;
    }

    return NextResponse.json({ voteCounts });
  } catch (error) {
    console.error('Votes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, value } = body as { gameId?: string; value?: number };

    if (!gameId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ error: 'gameId and value (1 or -1) are required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: existing } = await supabase
      .from('votes')
      .select('id,value')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle();

    let resultValue: number | null = value;
    let voteId: string | null = null;

    if (existing && (existing as VoteRow).value === value) {
      // Toggle off
      await supabase.from('votes').delete().eq('id', (existing as VoteRow).id);
      resultValue = null;
    } else if (existing) {
      await supabase.from('votes').update({ value }).eq('id', (existing as VoteRow).id);
      voteId = (existing as VoteRow).id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('votes')
        .insert({ game_id: gameId, user_id: user.id, value })
        .select('id')
        .single();

      if (insertError) {
        console.error('Vote insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 });
      }
      voteId = (inserted as { id: string }).id;
    }

    const score = await computeScore(supabase, gameId);

    return NextResponse.json({ voteId, value: resultValue, score });
  } catch (error) {
    console.error('Votes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = body as { gameId?: string };

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    await supabase.from('votes').delete().eq('game_id', gameId).eq('user_id', user.id);

    const score = await computeScore(supabase, gameId);

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Votes DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
