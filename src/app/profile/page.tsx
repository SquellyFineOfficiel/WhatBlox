import Link from 'next/link';

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Profile</span>
        <h1 className="mt-4 text-3xl font-black text-white">Your profile</h1>
        <p className="mt-3 text-sm text-rbx-muted">This page will later show Roblox identity details, public links, and account activity.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}