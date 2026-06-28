import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Legal</span>
        <h1 className="mt-4 text-3xl font-black text-white">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-rbx-muted">
          By using WhatBlox, you agree to submit lawful content, follow moderation decisions, and avoid abuse of voting, authentication, or platform systems.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-rbx-muted">
          <section>
            <h2 className="text-lg font-bold text-white">Acceptable Use</h2>
            <p>Do not submit malicious, deceptive, or infringing content. Do not automate votes or attempt to bypass moderation controls.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Accounts & Access</h2>
            <p>You are responsible for your Roblox account session and any actions performed through your authenticated account.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Moderation</h2>
            <p>The platform may review, reject, or remove submissions to protect community quality, safety, and legal compliance.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Service Availability</h2>
            <p>Features may change or be unavailable without notice. The service is provided as-is, with no guarantee of uninterrupted operation.</p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/privacy-policy" className="inline-flex rounded-xl border border-rbx-border px-5 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Read Privacy Policy
          </Link>
          <Link href="/" className="inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
