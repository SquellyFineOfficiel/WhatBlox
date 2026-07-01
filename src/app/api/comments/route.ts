import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const COMMENTS_PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'recent';

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing gameId' },
        { status: 400 }
      );
    }

    // Build sort query
    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        likes_count,
        reply_count,
        is_edited,
        created_at,
        updated_at,
        user_id,
        parent_id
      `, { count: 'exact' })
      .eq('game_id', gameId)
      .is('parent_id', null);

    // Apply sorting
    if (sort === 'trending') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * COMMENTS_PER_PAGE;
    const to = from + COMMENTS_PER_PAGE - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Get current user for checking if they liked comments
    const { data: { user } } = await supabase.auth.getUser();

    // Check which comments the current user has liked
    let likedCommentIds: string[] = [];
    if (user && data) {
      const commentIds = data.map((c: any) => c.id);
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      likedCommentIds = (likes || []).map((l: any) => l.comment_id);
    }

    return NextResponse.json(
      {
        comments: data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count || 0) / COMMENTS_PER_PAGE),
          totalResults: count || 0,
          resultsPerPage: COMMENTS_PER_PAGE,
        },
        likedCommentIds,
        sort,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in comments GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { gameId, content, parentId } = await req.json();

    if (!gameId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing gameId or content' },
        { status: 400 }
      );
    }

    if (content.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Verify game exists
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        game_id: gameId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(`
        id,
        content,
        likes_count,
        reply_count,
        is_edited,
        created_at,
        updated_at,
        user_id,
        parent_id
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
