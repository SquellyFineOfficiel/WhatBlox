import { NextResponse } from 'next/server';
import { getVerifiedServerUser } from '@/src/lib/auth-session';

export async function GET() {
  try {
    const user = await getVerifiedServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Auth user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
