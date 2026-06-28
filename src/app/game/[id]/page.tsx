import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { formatStat, getRobloxGameMetadata } from '@/src/lib/roblox';

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Configuration needed</span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Supabase is not configured yet</h1>
          <p className="mt-4 text-sm leading-7 text-rbx-muted">Add your project URL and anon key to .env.local to enable game detail pages and live data.</p>
        </div>
      </main>
    );
  }

  const { data: game } = await supabase.from('games').select('id,title,description,roblox_url,created_at,user_id').eq('id', id).single();

  if (!game) {
    notFound();
  }

  const metadata = await getRobloxGameMetadata(game.roblox_url);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface">
        {/* Gradient top strip */}
        <div className="h-1 w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />

        <div className="relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-rbx-purple/20 to-rbx-red/10 blur-3xl" />
          <Link href="/" className="relative rounded-md text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">← Back home</Link>
          <div className="relative mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-block rounded-md bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                Roblox spotlight
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white">{metadata?.title || game.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-rbx-muted">{metadata?.description || game.description}</p>
            </div>
            <a
              href={game.roblox_url}
              target="_blank"
              rel="noreferrer"
              className="self-start rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange"
            >
              ▶ Play on Roblox
            </a>
          </div>
        </div>

        <div className="grid gap-6 p-8 pt-0 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="overflow-hidden rounded-xl border border-rbx-border bg-rbx-surface-3">
            {metadata?.thumbnail_url ? (
              <img
                src={metadata.thumbnail_url}
                alt={metadata.title || game.title}
                width={640}
                height={360}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-60 items-center justify-center text-sm font-bold text-rbx-muted">Roblox thumbnail unavailable</div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-xs font-bold text-white">👥 {formatStat(metadata?.player_count)} playing</span>
              <span className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-xs font-bold text-white">🎮 {formatStat(metadata?.visits)} visits</span>
              <span className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-xs font-semibold text-rbx-muted">Submitted {dateFormatter.format(new Date(game.created_at))}</span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-rbx-border bg-rbx-surface-2 p-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rbx-purple/10 via-transparent to-transparent" />
              <h2 className="relative text-sm font-black text-white">Why this game stands out</h2>
              <p className="relative mt-2 text-sm leading-7 text-rbx-muted">This page surfaces Roblox-native details such as the thumbnail, live player count, and visit count whenever the game URL can be resolved automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
