import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — WhatBlox',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="rounded-2xl border border-rbx-border bg-rbx-surface p-6 sm:p-10">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-red to-rbx-orange px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Legal</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-rbx-muted">Effective date: July 1, 2025 &nbsp;·&nbsp; Last updated: July 1, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-rbx-muted">

          <section>
            <h2 className="text-base font-bold text-white">1. Introduction and Data Controller</h2>
            <p className="mt-2">
              WhatBlox ("we", "us", "our") operates the website accessible at whatblox.com (the "Service"). This Privacy Policy explains how
              we collect, use, store, and share personal data in accordance with applicable data protection laws, including the General Data
              Protection Regulation (EU) 2016/679 ("GDPR"), the California Consumer Privacy Act ("CCPA"), and other applicable legislation.
            </p>
            <p className="mt-2">
              For inquiries regarding this policy or to exercise your rights, contact us via the project repository or support channels
              designated by the operator.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">2. Personal Data We Collect</h2>
            <p className="mt-2">We collect the following categories of personal data:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-semibold text-white">Account identifiers.</span> Roblox OAuth identifiers, Roblox user ID, username, and profile avatar URL provided by Roblox when you authenticate via our OAuth integration.</li>
              <li><span className="font-semibold text-white">User-generated content.</span> Game submissions, reviewer messages, votes, comments, reviews, and playlist data you create on the Service.</li>
              <li><span className="font-semibold text-white">Technical and log data.</span> IP addresses, browser type, device identifiers, operating system, pages visited, referral URLs, and timestamps, collected automatically when you access the Service.</li>
              <li><span className="font-semibold text-white">Cookies and tracking data.</span> Session tokens, authentication cookies, and analytics identifiers (see Section 7 – Cookies).</li>
            </ul>
            <p className="mt-2">We do not collect payment information, government identification, or sensitive personal data as defined under Article 9 GDPR.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">3. Legal Basis for Processing (GDPR)</h2>
            <p className="mt-2">If you are located in the European Economic Area (EEA), we process your personal data on the following legal bases under Article 6 GDPR:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-semibold text-white">Performance of a contract (Art. 6(1)(b)).</span> Authentication, game submission, voting, and playlist functionality required to deliver the Service.</li>
              <li><span className="font-semibold text-white">Legitimate interests (Art. 6(1)(f)).</span> Service security, abuse prevention, platform integrity, and product analytics, where such interests are not overridden by your rights.</li>
              <li><span className="font-semibold text-white">Compliance with legal obligations (Art. 6(1)(c)).</span> Retention of records required by applicable law.</li>
              <li><span className="font-semibold text-white">Consent (Art. 6(1)(a)).</span> Analytics cookies and non-essential tracking, where consent is explicitly obtained.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">4. How We Use Your Data</h2>
            <p className="mt-2">We use your personal data for the following purposes:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Authenticating your account and maintaining your session;</li>
              <li>Publishing and moderating game submissions, votes, comments, and reviews;</li>
              <li>Detecting and preventing fraudulent activity, abuse, or Terms of Service violations;</li>
              <li>Measuring usage metrics and improving the Service;</li>
              <li>Complying with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">5. Data Sharing and Disclosure</h2>
            <p className="mt-2">We do not sell, rent, or trade your personal data. We may share data with:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-semibold text-white">Infrastructure providers.</span> Supabase, Inc. (database, authentication, and storage) and Vercel, Inc. (hosting) act as data processors under appropriate data processing agreements.</li>
              <li><span className="font-semibold text-white">Analytics providers.</span> Google LLC (Google Analytics / Google Tag Manager) under standard contractual clauses.</li>
              <li><span className="font-semibold text-white">Legal authorities.</span> Where required by law, court order, or regulatory mandate.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">6. Data Retention</h2>
            <p className="mt-2">
              We retain account-related data for as long as your session remains active and as long as necessary to fulfil the purposes
              described in this policy. User-generated content (submissions, votes, comments) is retained for operational and trust-and-safety
              purposes. You may request deletion in accordance with Section 8. Anonymised or aggregated data not linked to an individual may
              be retained indefinitely for analytical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">7. Cookies and Tracking Technologies</h2>
            <p className="mt-2">We use the following categories of cookies:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-semibold text-white">Essential cookies.</span> Session tokens and authentication cookies required for the Service to function. These cannot be disabled.</li>
              <li><span className="font-semibold text-white">Analytics cookies.</span> Google Analytics and Google Tag Manager for traffic measurement. These are subject to your consent where required by law.</li>
            </ul>
            <p className="mt-2">
              You may control non-essential cookies through your browser settings or applicable consent mechanisms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">8. Your Rights</h2>
            <p className="mt-2">Subject to applicable law and your jurisdiction, you may have the following rights:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-semibold text-white">Access (Art. 15 GDPR / CCPA).</span> Request a copy of the personal data we hold about you.</li>
              <li><span className="font-semibold text-white">Rectification (Art. 16 GDPR).</span> Request correction of inaccurate personal data.</li>
              <li><span className="font-semibold text-white">Erasure (Art. 17 GDPR / CCPA "right to delete").</span> Request deletion of your personal data, subject to legal retention obligations.</li>
              <li><span className="font-semibold text-white">Restriction (Art. 18 GDPR).</span> Request that we restrict processing of your personal data in certain circumstances.</li>
              <li><span className="font-semibold text-white">Data portability (Art. 20 GDPR).</span> Receive your data in a structured, machine-readable format.</li>
              <li><span className="font-semibold text-white">Objection (Art. 21 GDPR).</span> Object to processing based on legitimate interests.</li>
              <li><span className="font-semibold text-white">Withdraw consent.</span> Where processing is based on consent, withdraw it at any time without affecting prior lawful processing.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us through the channels listed in Section 9. We will respond within the timeframes required by applicable law (generally 30 days under GDPR).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">9. Contact and Complaints</h2>
            <p className="mt-2">
              For privacy-related requests or concerns, contact the WhatBlox operator through the project repository or designated support
              channels. If you are located in the EEA, you have the right to lodge a complaint with your local supervisory authority
              (e.g., the CNIL for France, the ICO for the United Kingdom).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">10. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy periodically. Material changes will be indicated by an updated "Last updated" date at the top
              of this page. Continued use of the Service after such changes constitutes your acceptance of the revised policy.
            </p>
          </section>

        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/terms-of-service" className="inline-flex rounded-full border border-rbx-border px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Terms of Service
          </Link>
          <Link href="/" className="inline-flex rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Back to home
          </Link>
        </div>
      </article>
    </main>
  );
}