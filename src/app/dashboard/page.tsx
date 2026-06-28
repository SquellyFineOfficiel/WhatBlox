import Link from 'next/link';
import { getServerUser } from '@/src/lib/auth-server';
import { createClient } from '@/src/lib/supabase/server';

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
      .in('status', ['pending', 'approved']),
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
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Dashboard</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Your games and stats</h1>
            <p className="mt-2 text-sm text-rbx-muted">Manage what you submitted and see where each game stands in the review pipeline.</p>
          </div>
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">
            <span className="font-bold text-white">Slots remaining:</span> {slotsRemaining} of 3
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Total games</p>
            <p className="mt-2 text-3xl font-black text-white">{gameCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Pending</p>
            <p className="mt-2 text-3xl font-black text-white">{(games ?? []).filter((game) => game.status === 'pending').length}</p>
          </div>
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Approved</p>
            <p className="mt-2 text-3xl font-black text-white">{(games ?? []).filter((game) => game.status === 'approved').length}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {gameList.map((game) => {
            const stats = voteMap.get(game.id) ?? { upvotes: 0, downvotes: 0 };
            const score = stats.upvotes - stats.downvotes;

            return (
              <article key={game.id} className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{game.title}</h2>
                      <span className="rounded-full border border-rbx-border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-rbx-muted">{game.status}</span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-rbx-muted">{game.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white">▲ {stats.upvotes}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white">▼ {stats.downvotes}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white">Score {score}</span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface px-2.5 py-1 text-white">Submitted {dateFormatter.format(new Date(game.created_at))}</span>
                    </div>
                  </div>
                  <Link href={`/game/${game.id}`} className="rounded-xl border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
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