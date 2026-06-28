import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-10 md:p-12">
        <span className="inline-block rounded-lg bg-gradient-to-r from-rbx-purple to-rbx-red px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">Settings</span>
        <h1 className="mt-6 text-4xl font-black text-white">Account settings</h1>
        <p className="mt-4 text-base text-rbx-muted leading-relaxed">Review account rules and privacy terms before sharing games. Your voting and submission activity follows these policies.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/dashboard" className="inline-flex rounded-xl border border-rbx-border px-6 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Back to dashboard
          </Link>
          <Link href="/privacy-policy" className="inline-flex rounded-xl border border-rbx-border px-6 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Privacy policy
          </Link>
          <Link href="/terms-of-service" className="inline-flex rounded-xl border border-rbx-border px-6 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Terms of service
          </Link>
        </div>
      </div>
    </main>
  );
}