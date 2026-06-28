import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { getServerUser } from '@/src/lib/auth-server';
import { isAdminServerUser } from '@/src/lib/profile';

type PendingGame = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default async function AdminQueuePage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/auth');
  }

  const user = await getServerUser();
  if (!user || !(await isAdminServerUser(user.id))) {
    redirect('/');
  }

  const { data: pendingGames } = await supabase
    .from('games')
    .select('id,title,description,roblox_url,created_at,user_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Admin review</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Pending submissions</h1>
        <p className="mt-2 text-sm text-rbx-muted">Review games before they go live.</p>

        <div className="mt-8 space-y-4">
          {((pendingGames ?? []) as PendingGame[]).map((game) => (
            <article key={game.id} className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{game.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-rbx-muted">{game.description}</p>
                  <p className="mt-3 text-xs text-rbx-muted">Submitted {dateFormatter.format(new Date(game.created_at))}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={`/admin/queue/${game.id}/approve`} method="post">
                    <button type="submit" className="rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
                      Approve
                    </button>
                  </form>
                  <form action={`/admin/queue/${game.id}/reject`} method="post" className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-rbx-muted">
                      Rejection reason
                      <textarea
                        name="reason"
                        rows={2}
                        required
                        autoComplete="off"
                        className="mt-1 w-56 rounded-xl border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
                      />
                    </label>
                    <button type="submit" className="rounded-xl border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                      Reject
                    </button>
                  </form>
                  <Link href={`/game/${game.id}`} className="rounded-xl border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                    Open
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {!(pendingGames ?? []).length ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-6 text-sm text-rbx-muted">No pending submissions right now.</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}