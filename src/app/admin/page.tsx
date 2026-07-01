import Link from 'next/link';
import { createAdminClient } from '@/src/lib/supabase/server';
import { getAdminUser, type AdminRole } from '@/src/lib/admin';
import { getAccessibleAdminTools } from '@/src/lib/admin-tools';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  moderator: 'Moderator',
  reviewer: 'Reviewer',
};

export default async function AdminPage() {
  const adminUser = await getAdminUser();
  const adminClient = createAdminClient();

  if (!adminUser || !adminClient) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
          <h1 className="text-3xl font-black text-white">Admin panel unavailable</h1>
          <p className="mt-3 text-rbx-muted">Admin access requires an authenticated admin account and server configuration.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl border border-rbx-border px-5 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const [reviewResult, queueResult, appealsResult, bansResult, actionsResult] = await Promise.all([
    adminClient.from('games').select('id', { count: 'exact', head: true }).eq('status', 'review'),
    adminClient.from('games').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('appeals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('banned_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    adminClient
      .from('moderation_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const metricErrors = [
    reviewResult.error,
    queueResult.error,
    appealsResult.error,
    bansResult.error,
    actionsResult.error,
  ].filter(Boolean);

  const metrics = [
    {
      label: 'Games in review',
      value: reviewResult.count ?? 0,
      href: '/admin/review',
      accent: 'text-cyan-300',
    },
    {
      label: 'Queue backlog',
      value: queueResult.count ?? 0,
      href: '/admin/queue',
      accent: 'text-indigo-300',
    },
    {
      label: 'Pending appeals',
      value: appealsResult.count ?? 0,
      href: '/admin/appeals',
      accent: 'text-amber-300',
    },
    {
      label: 'Active user bans',
      value: bansResult.count ?? 0,
      href: '/admin/ban-users',
      accent: 'text-rose-300',
    },
    {
      label: 'Actions in last 24h',
      value: actionsResult.count ?? 0,
      href: '/admin/logs',
      accent: 'text-emerald-300',
    },
  ];

  const urgentItems = [
    { label: 'Review queue', value: (reviewResult.count ?? 0) + (queueResult.count ?? 0), href: '/admin/review' },
    { label: 'Appeals waiting', value: appealsResult.count ?? 0, href: '/admin/appeals' },
  ].filter((item) => item.value > 0);

  const accessibleTools = getAccessibleAdminTools(adminUser.role);

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 border-b border-rbx-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
              Admin panel
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Fast moderation workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rbx-muted sm:text-base">
              Welcome back, {ROLE_LABELS[adminUser.role]}. Use the quick actions below to handle reviews, appeals, and moderation tasks faster.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/review" className="rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
              Open review
            </Link>
            <Link href="/admin/logs" className="rounded-xl border border-rbx-border px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rbx-surface-2">
              View logs
            </Link>
          </div>
        </div>

        {metricErrors.length > 0 && (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
            Some live metrics could not be loaded right now, but admin tools remain available.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <Link key={metric.label} href={metric.href} className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-4 transition hover:border-white/20 hover:bg-rbx-surface">
              <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">{metric.label}</p>
              <p className={`mt-2 text-3xl font-black ${metric.accent}`}>{metric.value}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5 sm:p-6">
            <h2 className="text-lg font-black text-white">Tools you can access</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {accessibleTools.map((tool) => (
                <Link
                  key={tool.key}
                  href={tool.href}
                  className={`rounded-xl border border-rbx-border bg-gradient-to-br ${tool.color} p-0.5 transition hover:scale-[1.01] hover:border-white/20`}
                >
                  <div className="h-full rounded-[11px] bg-rbx-surface px-4 py-4">
                    <p className="text-sm font-bold text-white">
                      {tool.icon} {tool.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-rbx-muted">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-rbx-border bg-rbx-surface-2 p-5 sm:p-6">
            <h2 className="text-lg font-black text-white">Needs attention</h2>
            {urgentItems.length > 0 ? (
              <div className="mt-4 space-y-2">
                {urgentItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-white transition hover:border-white/20"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-md bg-rbx-surface-2 px-2 py-1 text-xs font-black">{item.value}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-rbx-muted">
                No urgent moderation queue right now.
              </p>
            )}

            <div className="mt-4 rounded-xl border border-rbx-border bg-rbx-surface px-4 py-3 text-sm text-rbx-muted">
              Tip: start with <span className="font-semibold text-white">Review Games</span> and then clear <span className="font-semibold text-white">Appeals</span> for the fastest workflow.
            </div>
          </section>
        </div>

        {accessibleTools.length === 0 && (
          <div className="mt-8 rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-sm text-rbx-muted">
            No tools are currently assigned to your role.
          </div>
        )}
      </div>
    </main>
  );
}
