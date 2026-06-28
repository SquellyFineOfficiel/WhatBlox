import { NextResponse } from 'next/server';
import { getRobloxGameMetadata } from '@/src/lib/roblox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const robloxUrl = searchParams.get('url');

  if (!robloxUrl) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
  }

  const metadata = await getRobloxGameMetadata(robloxUrl);
  return NextResponse.json({ metadata });
}
