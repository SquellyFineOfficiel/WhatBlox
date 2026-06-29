import { createClient } from '@/src/lib/supabase/server';
import { getVerifiedServerUser } from '@/src/lib/auth-session';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch wishlist items
// POST: Add game to wishlist
// DELETE: Remove game from wishlist
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wishlistId = searchParams.get('wishlistId');

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'wishlistId is required' },
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

    // Get wishlist items with game details
    const { data: items, error } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        game_id,
        added_at,
        games:game_id (
          id,
          title,
          description,
          roblox_url,
          created_at,
          user_id
        )
      `)
      .eq('wishlist_id', wishlistId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Wishlist items fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wishlist items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId, gameId } = body;

    if (!wishlistId || !gameId) {
      return NextResponse.json(
        { error: 'wishlistId and gameId are required' },
        { status: 400 }
      );
    }

    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Verify user owns this wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlistId)
      .single();

    if (!wishlist || wishlist.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add item to wishlist
    const { data: item, error } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlistId,
        game_id: gameId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Game is already in this wishlist' },
          { status: 409 }
        );
      }
      console.error('Item insert error:', error);
      return NextResponse.json(
        { error: 'Failed to add item to wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Wishlist item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistItemId } = body;

    if (!wishlistItemId) {
      return NextResponse.json(
        { error: 'wishlistItemId is required' },
        { status: 400 }
      );
    }

    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Verify user owns this wishlist item
    const { data: item } = await supabase
      .from('wishlist_items')
      .select(`
        wishlist_id,
        wishlists:wishlist_id (
          user_id
        )
      `)
      .eq('id', wishlistItemId)
      .single();

    if (!item || !item.wishlists || item.wishlists[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete item
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistItemId);

    if (error) {
      console.error('Item delete error:', error);
      return NextResponse.json(
        { error: 'Failed to remove item from wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Wishlist item delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
