import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

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

    const { commentId, isLiking } = await req.json();

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing commentId' },
        { status: 400 }
      );
    }

    // Verify comment exists
    const { data: comment } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (isLiking) {
      // Add like (ignore if already liked)
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      // 23505 is unique constraint violation - it's fine if they already liked
      if (error && error.code !== '23505') {
        console.error('Error adding like:', error);
        return NextResponse.json(
          { error: 'Failed to like comment' },
          { status: 500 }
        );
      }
    } else {
      // Remove like
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing like:', error);
        return NextResponse.json(
          { error: 'Failed to unlike comment' },
          { status: 500 }
        );
      }
    }

    // Fetch updated comment
    const { data: updatedComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, likes_count')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated comment:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error('Error in comment like POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
