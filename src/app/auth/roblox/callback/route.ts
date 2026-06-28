import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createSignedSessionCookie, sessionCookieName } from '@/src/lib/auth-session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/auth?error=missing-params', request.url));
  }

  const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_OAUTH_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const origin = appUrl ? appUrl : `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  const redirectUri = `${origin}/auth/roblox/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/auth?error=oauth-config', request.url));
  }

  const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL('/auth?error=token-exchange', request.url));
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData?.access_token;

  if (!accessToken) {
    return NextResponse.redirect(new URL('/auth?error=token-missing', request.url));
  }

  const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(new URL('/auth?error=userinfo', request.url));
  }

  const userInfo = await userResponse.json();
  const userName = userInfo?.name || userInfo?.display_name || userInfo?.username || 'Roblox user';
  const userId = userInfo?.sub || userInfo?.user_id || userInfo?.id || null;
  const avatarUrl = userInfo?.picture || userInfo?.profile_image_url || userInfo?.avatarUrl || null;

  if (userId) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.from('profiles').upsert({
        id: String(userId),
        display_name: userName,
        avatar_url: avatarUrl,
        role: 'user',
        updated_at: new Date().toISOString(),
      });
    }
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  const sessionValue = createSignedSessionCookie({
    id: String(userId ?? ''),
    name: userName,
    avatarUrl,
  });

  response.cookies.set('rbx_user_name', userName, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
  if (userId) {
    response.cookies.set('rbx_user_id', String(userId), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }
  if (avatarUrl) {
    response.cookies.set('rbx_user_avatar', String(avatarUrl), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }
  if (sessionValue) {
    response.cookies.set(sessionCookieName(), sessionValue, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: url.protocol === 'https:',
    });
  }
  return response;
}
