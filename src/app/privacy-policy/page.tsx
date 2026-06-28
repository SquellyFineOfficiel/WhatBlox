import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Legal</span>
        <h1 className="mt-4 text-3xl font-black text-white">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-rbx-muted">
          WhatBlox collects only the data needed to run core features such as account access, game submissions, voting, and moderation.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-7 text-rbx-muted">
          <section>
            <h2 className="text-lg font-bold text-white">Information We Collect</h2>
            <p>We process Roblox OAuth account identifiers, profile display data shared by Roblox, and data you provide in submissions, votes, and moderation actions.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">How We Use Information</h2>
            <p>Data is used to authenticate accounts, display submissions, rank games, detect abuse, and keep the service secure and reliable.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Data Retention</h2>
            <p>Submission, vote, and moderation records are retained as long as needed for product operations and trust & safety requirements.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Contact</h2>
            <p>For privacy requests, contact the WhatBlox team through the project repository or support channels linked by the operator.</p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/terms-of-service" className="inline-flex rounded-xl border border-rbx-border px-5 py-3 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Read Terms of Service
          </Link>
          <Link href="/" className="inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
