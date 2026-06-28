import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Settings</span>
        <h1 className="mt-4 text-3xl font-black text-white">Account settings</h1>
        <p className="mt-3 text-sm text-rbx-muted">This page is ready for notification, privacy, and moderation preferences.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl border border-rbx-border px-5 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}