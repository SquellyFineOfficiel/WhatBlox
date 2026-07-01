import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — WhatBlox',
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="rounded-2xl border border-rbx-border bg-rbx-surface p-6 sm:p-10">
        <span className="inline-block rounded-md bg-gradient-to-r from-rbx-purple to-rbx-red px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Legal</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-rbx-muted">Effective date: July 1, 2025 &nbsp;·&nbsp; Last updated: July 1, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-rbx-muted">

          <section>
            <h2 className="text-base font-bold text-white">1. Agreement to Terms</h2>
            <p className="mt-2">
              By accessing or using the WhatBlox website and services (collectively, the "Service"), you agree to be legally bound by these
              Terms of Service ("Terms") and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these
              Terms, you must cease using the Service immediately.
            </p>
            <p className="mt-2">
              We reserve the right to modify these Terms at any time. Material changes will be indicated by an updated "Last updated" date.
              Your continued use of the Service after such changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">2. Eligibility</h2>
            <p className="mt-2">
              You must be at least 13 years of age to use the Service. If you are under the age of majority in your jurisdiction, you confirm
              that you have obtained the consent of a parent or legal guardian. The Service is not directed to children under 13. If we
              become aware that a user is under 13, we will terminate their access and delete any associated data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">3. Account Registration and Security</h2>
            <p className="mt-2">
              Access to certain features requires authentication via Roblox OAuth. You are solely responsible for all activities conducted
              through your authenticated session. You must:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Maintain the confidentiality of your account credentials;</li>
              <li>Notify us immediately of any unauthorised access or security breach;</li>
              <li>Not share, transfer, or sell access to your account;</li>
              <li>Not use automated scripts, bots, or other means to create or access accounts.</li>
            </ul>
            <p className="mt-2">
              We are not liable for any loss or damage arising from your failure to comply with these security obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">4. Acceptable Use Policy</h2>
            <p className="mt-2">You agree not to use the Service to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Submit, distribute, or promote content that is unlawful, defamatory, fraudulent, obscene, or violates the intellectual property rights of any third party;</li>
              <li>Submit games that contain malware, phishing links, or content designed to harm or deceive users;</li>
              <li>Manipulate votes, rankings, or reviews through automated means, artificial inflation, or coordinated inauthentic behaviour;</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features, access controls, or moderation systems;</li>
              <li>Harvest or collect data about other users without their consent;</li>
              <li>Engage in conduct that disrupts, damages, or impairs the operation of the Service or the experience of other users;</li>
              <li>Violate any applicable local, national, or international law or regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">5. User-Generated Content</h2>
            <p className="mt-2">
              By submitting game listings, reviews, comments, or other content ("User Content") to the Service, you represent and warrant that:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You own, or have the necessary rights and licences to submit, such content;</li>
              <li>Your content does not infringe any intellectual property rights, privacy rights, or other rights of any third party;</li>
              <li>Your content complies with these Terms and all applicable laws.</li>
            </ul>
            <p className="mt-2">
              You grant WhatBlox a non-exclusive, worldwide, royalty-free, sublicensable licence to use, display, reproduce, and distribute
              your User Content solely for the purpose of operating and improving the Service. You retain ownership of your User Content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">6. Intellectual Property</h2>
            <p className="mt-2">
              All content, design, software, trademarks, and other materials comprising the Service (excluding User Content and third-party
              materials) are owned by or licensed to WhatBlox and are protected by applicable intellectual property laws. You may not
              reproduce, modify, distribute, or create derivative works of such materials without our prior written consent.
            </p>
            <p className="mt-2">
              Roblox® is a registered trademark of Roblox Corporation. WhatBlox is an independent platform and is not affiliated with,
              endorsed by, or sponsored by Roblox Corporation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">7. Content Moderation</h2>
            <p className="mt-2">
              WhatBlox reserves the right, but is not obligated, to review, approve, reject, remove, or modify any User Content at our sole
              discretion, at any time, without prior notice. We may suspend or permanently terminate your access to the Service for
              violations of these Terms or for any other reason we deem appropriate to protect the safety, integrity, and legality of the
              platform. Moderation decisions may be appealed by contacting us through the designated support channels.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">8. Third-Party Services and Links</h2>
            <p className="mt-2">
              The Service links to and integrates with third-party platforms, including Roblox. We do not control and are not responsible
              for the content, privacy practices, or availability of third-party services. Your use of third-party services is governed by
              their respective terms of service and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">9. Disclaimer of Warranties</h2>
            <p className="mt-2">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR
              OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR
              OTHER HARMFUL COMPONENTS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">10. Limitation of Liability</h2>
            <p className="mt-2">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WHATBLOX AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR
              IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO
              EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE
              CLAIM, OR (B) ONE HUNDRED EUROS (€100).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">11. Indemnification</h2>
            <p className="mt-2">
              You agree to indemnify, defend, and hold harmless WhatBlox and its operators from and against any claims, liabilities,
              damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with your access to
              or use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">12. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account and access to the Service at any time, with or without cause, with or without
              notice. Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature
              should survive termination shall survive, including Sections 5 through 13.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">13. Governing Law and Dispute Resolution</h2>
            <p className="mt-2">
              These Terms are governed by and construed in accordance with the laws of the jurisdiction in which the operator is
              established, without regard to its conflict-of-law provisions. Any dispute arising out of or relating to these Terms or
              the Service shall first be subject to good-faith negotiation between the parties. If unresolved, disputes shall be submitted
              to the competent courts of the operator's jurisdiction. If you are a consumer in the EEA, you may also have the right to
              use the EU Online Dispute Resolution platform at https://ec.europa.eu/consumers/odr.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">14. Severability and Entire Agreement</h2>
            <p className="mt-2">
              If any provision of these Terms is held to be invalid or unenforceable, that provision shall be modified to the minimum
              extent necessary to make it enforceable, and the remaining provisions shall continue in full force. These Terms, together
              with the Privacy Policy, constitute the entire agreement between you and WhatBlox with respect to the Service.
            </p>
          </section>

        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/privacy-policy" className="inline-flex rounded-full border border-rbx-border px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rbx-surface-2 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Privacy Policy
          </Link>
          <Link href="/" className="inline-flex rounded-full bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-rbx-orange">
            Back to home
          </Link>
        </div>
      </article>
    </main>
  );
}