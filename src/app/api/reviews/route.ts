import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = searchParams.get('sort') || 'recent';

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
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

    const resultsPerPage = 10;
    const offset = (page - 1) * resultsPerPage;

    let query = supabase
      .from('reviews')
      .select('id,game_id,user_id,rating,title,content,helpful_count,unhelpful_count,created_at,updated_at', { count: 'exact' })
      .eq('game_id', gameId)
      .eq('status', 'published');

    if (sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    } else if (sort === 'rating_high') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'rating_low') {
      query = query.order('rating', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + resultsPerPage - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Reviews fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get reviewer profiles
    const reviewerIds = [...new Set((reviews || []).map(r => r.user_id))];
    let reviewers: Record<string, any> = {};

    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,display_name,avatar_url')
        .in('id', reviewerIds);

      if (profiles) {
        reviewers = Object.fromEntries(profiles.map(p => [p.id, p]));
      }
    }

    // Calculate average rating and count
    let avgRating = 0;
    let ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (reviews && reviews.length > 0) {
      const allReviewsQuery = await supabase
        .from('reviews')
        .select('rating')
        .eq('game_id', gameId)
        .eq('status', 'published');

      if (allReviewsQuery.data) {
        allReviewsQuery.data.forEach(r => {
          ratingCounts[r.rating]++;
        });
        avgRating = allReviewsQuery.data.reduce((sum, r) => sum + r.rating, 0) / allReviewsQuery.data.length;
      }
    }

    const totalPages = count ? Math.ceil(count / resultsPerPage) : 0;

    return NextResponse.json({
      reviews: (reviews || []).map(r => ({
        ...r,
        reviewer: reviewers[r.user_id] || { display_name: 'Anonymous', avatar_url: null }
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: count || 0,
        resultsPerPage,
      },
      stats: {
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: count || 0,
        ratingDistribution: ratingCounts,
      },
      sort,
    });
  } catch (error) {
    console.error('Reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, rating, title, content } = body;

    if (!gameId || !rating || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, rating, title, content' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
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

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        game_id: gameId,
        user_id: user.user.id,
        rating: parseInt(rating),
        title: title.trim().slice(0, 200),
        content: content.trim().slice(0, 5000),
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this game' },
          { status: 409 }
        );
      }
      console.error('Review insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
