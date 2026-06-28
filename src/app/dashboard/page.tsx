import Link from 'next/link';
import { getServerUser } from '@/src/lib/auth-server';
import { createClient } from '@/src/lib/supabase/server';
import { getAdminUser } from '@/src/lib/admin';

type GameRow = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  status: string;
};

type VoteRow = {
  game_id: string;
  value: number;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h1 className="text-2xl font-black text-white">Dashboard unavailable</h1>
          <p className="mt-3 text-sm text-rbx-muted">Configure Supabase to unlock the user dashboard.</p>
        </div>
      </main>
    );
  }

  const user = await getServerUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h1 className="text-2xl font-black text-white">Sign in required</h1>
          <p className="mt-3 text-sm text-rbx-muted">You need to connect your Roblox account to view your dashboard.</p>
          <Link href="/auth" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const adminUser = await getAdminUser();

  const [{ data: games }, { count: gameCount }] = await Promise.all([
    supabase
      .from('games')
      .select('id,title,description,roblox_url,created_at,status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['review', 'approved']),
  ]);

  const gameList = (games ?? []) as GameRow[];
  const gameIds = gameList.map((game) => game.id);
  const { data: voteRows } = gameIds.length
    ? await supabase.from('votes').select('game_id,value').in('game_id', gameIds)
    : { data: [] as VoteRow[] };

  const voteMap = new Map<string, { upvotes: number; downvotes: number }>();
  for (const vote of (voteRows ?? []) as VoteRow[]) {
    const current = voteMap.get(vote.game_id) ?? { upvotes: 0, downvotes: 0 };
    if (vote.value > 0) {
      current.upvotes += 1;
    } else if (vote.value < 0) {
      current.downvotes += 1;
    }
    voteMap.set(vote.game_id, current);
  }

  const slotsRemaining = Math.max(0, 3 - (gameCount ?? 0));

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-10 md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">Dashboard</span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Your games and stats</h1>
            <p className="mt-3 text-base text-rbx-muted leading-relaxed">Manage what you submitted and see where each game stands in the review pipeline.</p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-5 py-4 text-sm text-rbx-muted whitespace-nowrap">
              <span className="font-bold text-white">Slots remaining:</span> {slotsRemaining} of 3
            </div>
            {adminUser && (
              <Link href="/admin" className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500">
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Total games</p>
            <p className="mt-3 text-4xl font-black text-white">{gameCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">In review</p>
            <p className="mt-3 text-4xl font-black text-white">{(games ?? []).filter((game) => game.status === 'review').length}</p>
          </div>
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Approved</p>
            <p className="mt-3 text-4xl font-black text-white">{(games ?? []).filter((game) => game.status === 'approved').length}</p>
          </div>
        </div>

        <div className="mt-12 space-y-5">
          {gameList.map((game) => {
            const stats = voteMap.get(game.id) ?? { upvotes: 0, downvotes: 0 };
            const score = stats.upvotes - stats.downvotes;

            return (
              <article key={game.id} className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-white">{game.title}</h2>
                      <span className="rounded-full border border-rbx-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-rbx-muted">{game.status}</span>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-rbx-muted">{game.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">▲ {stats.upvotes}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">▼ {stats.downvotes}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">Score {score}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-white font-medium">Submitted {dateFormatter.format(new Date(game.created_at))}</span>
                    </div>
                  </div>
                  <Link href={`/game/${game.id}`} className="shrink-0 rounded-xl border border-rbx-border px-5 py-3 text-sm font-semibold text-rbx-muted transition hover:text-white hover:border-white/20 focus-visible:ring-2 focus-visible:ring-rbx-orange">
                    Open
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}