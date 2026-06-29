import { createClient } from '@/src/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user's wishlists
// POST: Create a new wishlist
export async function GET(request: NextRequest) {
  try {
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

    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select('id,name,description,is_public,created_at,updated_at')
      .eq('user_id', user.user.id)
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

    const { data: wishlist, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.user.id,
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
