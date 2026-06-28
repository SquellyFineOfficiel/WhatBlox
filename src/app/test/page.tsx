'use client';

export default function TestPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-10">
        <h1 className="text-3xl font-black text-white">Test Page</h1>
        
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <p className="text-white">Environment Variables:</p>
            <pre className="mt-3 overflow-auto rounded bg-black/50 p-4 text-sm text-green-400">
{`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing'}
RBX_ADMIN_USER_IDS: ${process.env.RBX_ADMIN_USER_IDS}`}
            </pre>
          </div>

          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <p className="text-white">Check console for more info. Go to:</p>
            <ul className="mt-3 space-y-2 text-sm text-rbx-muted">
              <li><a href="/dashboard" className="text-rbx-orange hover:underline">→ Dashboard (check if Admin Panel button shows)</a></li>
              <li><a href="/admin" className="text-purple-400 hover:underline">→ Admin Panel</a></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
