import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const RESULTS_PER_PAGE = 12;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sortBy = searchParams.get('sort') || 'newest';

    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
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

    let gameQuery = supabase
      .from('games')
      .select('id,title,description,roblox_url,created_at,user_id', {
        count: 'exact',
      })
      .eq('status', 'approved');

    // Apply search filter
    if (query) {
      gameQuery = gameQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Apply sorting
    if (sortBy === 'trending') {
      // Trending: order by votes count (requires a join with votes table)
      gameQuery = gameQuery.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      gameQuery = gameQuery.order('created_at', { ascending: true });
    } else {
      // Default: newest first
      gameQuery = gameQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (page - 1) * RESULTS_PER_PAGE;
    gameQuery = gameQuery.range(offset, offset + RESULTS_PER_PAGE - 1);

    const { data, error, count } = await gameQuery;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search games' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / RESULTS_PER_PAGE) : 0;

    return NextResponse.json({
      games: data || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: count || 0,
        resultsPerPage: RESULTS_PER_PAGE,
      },
      query,
      sortBy,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
