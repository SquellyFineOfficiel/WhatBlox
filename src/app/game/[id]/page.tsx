import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { formatStat, getRobloxGameMetadata } from '@/src/lib/roblox';
import ReviewsSection from '@/src/components/reviews-section';
import CommentsSection from '@/src/components/comments-section';
import AddToWishlistButton from '@/src/components/add-to-wishlist-button';
import FollowGameButton from '@/src/components/follow-game-button';

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h1 className="text-2xl font-black text-white">Supabase not configured</h1>
          <p className="mt-2 text-sm text-rbx-muted">Add your project URL and anon key to .env.local.</p>
        </div>
      </main>
    );
  }

  const { data: game } = await supabase
    .from('games')
    .select('id,title,description,roblox_url,created_at,user_id')
    .eq('id', id)
    .single();

  if (!game) notFound();

  const [metadata, allGamesRes, relatedRes] = await Promise.all([
    getRobloxGameMetadata(game.roblox_url),
    supabase.from('games').select('id').eq('status', 'approved').order('created_at', { ascending: false }),
    supabase.from('games').select('id,title,description').eq('status', 'approved').neq('id', id).limit(20),
  ]);

  const ids = ((allGamesRes.data ?? []) as { id: string }[]).map(g => g.id);
  const idx = ids.indexOf(id);
  const prevId = idx > 0 ? ids[idx - 1] : null;
  const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;

  const related = ((relatedRes.data ?? []) as { id: string; title: string; description: string }[])
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  const title = metadata?.title || game.title;
  const description = metadata?.description || game.description;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Navigation row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-rbx-muted transition hover:text-white rounded focus-visible:ring-2 focus-visible:ring-rbx-orange"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Link>
        <div className="flex items-center gap-2">
          {prevId ? (
            <Link href={`/game/${prevId}`} className="flex items-center gap-1.5 rounded-full border border-rbx-border px-3 py-1.5 text-xs font-medium text-rbx-muted transition hover:border-white/20 hover:text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
              Prev
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-rbx-border/30 px-3 py-1.5 text-xs text-rbx-muted/30 cursor-not-allowed">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
              Prev
            </span>
          )}
          {nextId ? (
            <Link href={`/game/${nextId}`} className="flex items-center gap-1.5 rounded-full border border-rbx-border px-3 py-1.5 text-xs font-medium text-rbx-muted transition hover:border-white/20 hover:text-white">
              Next
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-rbx-border/30 px-3 py-1.5 text-xs text-rbx-muted/30 cursor-not-allowed">
              Next
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface">
        <div className="grid lg:grid-cols-2">
          <div className="relative order-1 min-h-[220px] overflow-hidden bg-rbx-surface-3 lg:order-2 lg:min-h-[300px]">
            {metadata?.thumbnail_url ? (
              <img
                src={metadata.thumbnail_url}
                alt={title}
                width={640}
                height={360}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-black text-rbx-muted">No thumbnail</div>
            )}
          </div>
          <div className="order-2 flex flex-col justify-between p-7 lg:order-1">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight lg:text-4xl">{title}</h1>
              <p className="mt-3 text-sm text-rbx-muted leading-relaxed line-clamp-4">{description}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rbx-muted">Playing</p>
                <p className="mt-1 text-xl font-black text-white tabular-nums">{formatStat(metadata?.player_count)}</p>
              </div>
              <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rbx-muted">Visits</p>
                <p className="mt-1 text-xl font-black text-white tabular-nums">{formatStat(metadata?.visits)}</p>
              </div>
              <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rbx-muted">Added</p>
                <p className="mt-1 text-sm font-bold text-white">{dateFormatter.format(new Date(game.created_at))}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={game.roblox_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
              >
                Play Now
              </a>
              <AddToWishlistButton gameId={id} />
              <FollowGameButton gameId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews + Comments */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <ReviewsSection gameId={id} robloxUrl={game.roblox_url} />
        <CommentsSection gameId={id} />
      </div>

      {/* More games */}
      {related.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">More games</h2>
            <Link href="/discovery" className="text-sm text-rbx-muted transition hover:text-white">See all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(g => (
              <Link
                key={g.id}
                href={`/game/${g.id}`}
                className="rounded-2xl border border-rbx-border bg-rbx-surface p-4 transition hover:border-white/20 hover:-translate-y-px"
              >
                <p className="line-clamp-1 text-sm font-bold text-white">{g.title}</p>
                <p className="mt-1.5 line-clamp-2 text-xs text-rbx-muted">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}