import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, isHelpful } = body;

    if (!reviewId || isHelpful === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewId, isHelpful' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already voted
    const { data: existing } = await supabase
      .from('review_helpful')
      .select('id,is_helpful')
      .eq('review_id', reviewId)
      .eq('user_id', user.user.id)
      .single();

    if (existing) {
      // If voting the same way, remove the vote
      if (existing.is_helpful === isHelpful) {
        await supabase
          .from('review_helpful')
          .delete()
          .eq('id', existing.id);

        // Update review counts
        if (isHelpful) {
          await supabase
            .from('reviews')
            .update({ helpful_count: supabase.from('reviews').select().gt('helpful_count', 0) })
            .eq('id', reviewId);
        } else {
          await supabase
            .from('reviews')
            .update({ unhelpful_count: supabase.from('reviews').select().gt('unhelpful_count', 0) })
            .eq('id', reviewId);
        }

        return NextResponse.json({ removed: true });
      } else {
        // Change vote
        await supabase
          .from('review_helpful')
          .update({ is_helpful: isHelpful })
          .eq('id', existing.id);

        return NextResponse.json({ updated: true });
      }
    } else {
      // New vote
      const { error: voteError } = await supabase
        .from('review_helpful')
        .insert({
          review_id: reviewId,
          user_id: user.user.id,
          is_helpful: isHelpful,
        });

      if (voteError) {
        console.error('Vote insert error:', voteError);
        return NextResponse.json(
          { error: 'Failed to record vote' },
          { status: 500 }
        );
      }

      // Update review counts
      const { data: review } = await supabase
        .from('reviews')
        .select('helpful_count,unhelpful_count')
        .eq('id', reviewId)
        .single();

      if (review) {
        const newCounts = {
          helpful_count: review.helpful_count + (isHelpful ? 1 : 0),
          unhelpful_count: review.unhelpful_count + (!isHelpful ? 1 : 0),
        };

        await supabase
          .from('reviews')
          .update(newCounts)
          .eq('id', reviewId);
      }

      return NextResponse.json({ created: true }, { status: 201 });
    }
  } catch (error) {
    console.error('Review helpful error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
