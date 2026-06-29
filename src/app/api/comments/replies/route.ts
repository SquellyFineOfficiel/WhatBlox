import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const REPLIES_PER_PAGE = 10;

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
    const commentId = searchParams.get('commentId');
    const page = parseInt(searchParams.get('page') || '1');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing commentId' },
        { status: 400 }
      );
    }

    // Fetch replies
    const from = (page - 1) * REPLIES_PER_PAGE;
    const to = from + REPLIES_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        likes_count,
        is_edited,
        created_at,
        updated_at,
        user_id,
        profiles:user_id(display_name, avatar_url)
      `)
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching replies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch replies' },
        { status: 500 }
      );
    }

    // Get current user for checking if they liked replies
    const { data: { user } } = await supabase.auth.getUser();

    let likedReplyIds: string[] = [];
    if (user && data) {
      const replyIds = data.map((r: any) => r.id);
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', replyIds);

      likedReplyIds = (likes || []).map((l: any) => l.comment_id);
    }

    return NextResponse.json(
      {
        replies: data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count || 0) / REPLIES_PER_PAGE),
          totalResults: count || 0,
          resultsPerPage: REPLIES_PER_PAGE,
        },
        likedReplyIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in replies GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
