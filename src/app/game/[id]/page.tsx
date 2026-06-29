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
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 md:p-10">
          <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">Configuration needed</span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Supabase is not configured yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-rbx-muted">Add your project URL and anon key to .env.local to enable game detail pages and live data.</p>
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
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Navigation */}
      <Link href="/" className="inline-flex text-sm font-semibold text-rbx-muted transition hover:text-white mb-8 focus-visible:ring-2 focus-visible:ring-rbx-orange rounded-md">
        ← Back to trending
      </Link>

      {/* Hero Section with Thumbnail */}
      <div className="mb-12 overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface">
        <div className="h-1 w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />
        
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 p-8 md:p-10">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-rbx-purple/20 to-rbx-red/10 blur-3xl" />
          
          {/* Left: Content */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                Featured
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-4">
              {metadata?.title || game.title}
            </h1>
            
            <p className="text-base text-rbx-muted leading-relaxed mb-8 max-w-xl">
              {metadata?.description || game.description}
            </p>

            {/* Live Stats - Horizontal Layout */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-4 py-3">
                <div className="text-xs font-semibold text-rbx-muted mb-1">Players online</div>
                <div className="text-lg font-black text-white">👥 {formatStat(metadata?.player_count)}</div>
              </div>
              <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-4 py-3">
                <div className="text-xs font-semibold text-rbx-muted mb-1">Total visits</div>
                <div className="text-lg font-black text-white">🎮 {formatStat(metadata?.visits)}</div>
              </div>
              <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-4 py-3">
                <div className="text-xs font-semibold text-rbx-muted mb-1">Submitted</div>
                <div className="text-sm font-black text-white">{dateFormatter.format(new Date(game.created_at))}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href={game.roblox_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-8 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange"
              >
                ▶ Play Now
              </a>
              <AddToWishlistButton gameId={id} />
              <FollowGameButton gameId={id} />
            </div>
          </div>

          {/* Right: Thumbnail */}
          <div className="relative overflow-hidden rounded-xl border border-rbx-border bg-rbx-surface-3 aspect-video lg:aspect-auto lg:min-h-80">
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
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rbx-surface-2 to-rbx-surface-3 text-sm font-black text-rbx-muted">No thumbnail</div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews and Comments Section - Two Column on Desktop */}
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        {/* Left: Reviews */}
        <div>
          <ReviewsSection gameId={id} robloxUrl={game.roblox_url} />
        </div>

        {/* Right: Comments */}
        <div>
          <CommentsSection gameId={id} />
        </div>
      </div>
    </main>
  );
}
