import { createClient } from '@/src/lib/supabase/server';
import { getVerifiedServerUser } from '@/src/lib/auth-session';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user's wishlists
// POST: Create a new wishlist
export async function GET(request: NextRequest) {
  try {
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

    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select('id,name,description,is_public,created_at,updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Wishlists fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wishlists' },
        { status: 500 }
      );
    }

    return NextResponse.json({ wishlists });
  } catch (error) {
    console.error('Wishlists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Wishlist name is required' },
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

    const { data: wishlist, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        name: name.trim().slice(0, 100),
        description: description ? description.trim().slice(0, 500) : null,
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Wishlist creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    console.error('Wishlist creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId, name, description, isPublic } = body;

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'wishlistId is required' },
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

    const { data: existing } = await supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlistId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof name === 'string') {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Wishlist name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = name.trim().slice(0, 100);
    }
    if (description !== undefined) {
      updates.description = description ? String(description).trim().slice(0, 500) : null;
    }
    if (typeof isPublic === 'boolean') {
      updates.is_public = isPublic;
    }

    const { data: wishlist, error } = await supabase
      .from('wishlists')
      .update(updates)
      .eq('id', wishlistId)
      .select()
      .single();

    if (error) {
      console.error('Wishlist update error:', error);
      return NextResponse.json(
        { error: 'Failed to update wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId } = body;

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'wishlistId is required' },
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

    const { data: existing } = await supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlistId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove items first in case the DB doesn't have ON DELETE CASCADE set up yet.
    await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlistId);

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) {
      console.error('Wishlist delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
