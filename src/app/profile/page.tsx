import Link from 'next/link';

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Profile</span>
        <h1 className="mt-4 text-3xl font-black text-white">Your Profile Hub</h1>
        <p className="mt-3 text-sm text-rbx-muted">Use your dashboard to manage submissions and track game performance. Use settings and legal pages to review your account preferences and platform policies.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Open dashboard
          </Link>
          <Link href="/settings" className="inline-flex rounded-xl border border-rbx-border px-5 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Open settings
          </Link>
        </div>
      </div>
    </main>
  );
}