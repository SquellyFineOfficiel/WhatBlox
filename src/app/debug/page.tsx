import { getServerUser } from '@/src/lib/auth-server';
import { getAdminUser } from '@/src/lib/admin';
import { createClient } from '@/src/lib/supabase/server';

export default async function DebugPage() {
  const user = await getServerUser();
  const adminUser = await getAdminUser();
  const supabase = await createClient();

  let adminUserRaw = null;
  if (user && supabase) {
    const { data } = await supabase.from('admin_users').select('*').eq('id', user.id).single();
    adminUserRaw = data;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-10">
        <h1 className="text-3xl font-black text-white">Debug Info</h1>

        <div className="mt-8 space-y-6">
          {/* Server User */}
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <h2 className="text-lg font-bold text-white">Server User</h2>
            {user ? (
              <pre className="mt-3 overflow-auto rounded bg-black/50 p-4 text-sm text-green-400">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="mt-3 text-rbx-muted">No server user found</p>
            )}
          </div>

          {/* Admin User */}
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <h2 className="text-lg font-bold text-white">Admin Status</h2>
            {adminUser ? (
              <div>
                <p className="mt-3 text-green-400 font-bold">✓ YOU ARE AN ADMIN</p>
                <pre className="mt-3 overflow-auto rounded bg-black/50 p-4 text-sm text-green-400">
                  {JSON.stringify(adminUser, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="mt-3 text-red-400 font-bold">✗ NOT AN ADMIN</p>
            )}
          </div>

          {/* Raw Database Query */}
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <h2 className="text-lg font-bold text-white">Raw Database Lookup</h2>
            {user ? (
              <div>
                <p className="mt-2 text-sm text-rbx-muted">
                  Query: <code className="text-white">SELECT * FROM admin_users WHERE id = '{user.id}'</code>
                </p>
                {adminUserRaw ? (
                  <pre className="mt-3 overflow-auto rounded bg-black/50 p-4 text-sm text-yellow-400">
                    {JSON.stringify(adminUserRaw, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-3 text-red-400">No record found in admin_users table</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-rbx-muted">No user logged in</p>
            )}
          </div>

          {/* Navigation */}
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <h2 className="text-lg font-bold text-white">Navigation</h2>
            <div className="mt-3 space-y-2">
              <p>
                <a href="/dashboard" className="text-rbx-orange hover:underline">
                  → Back to Dashboard
                </a>
              </p>
              {adminUser && (
                <p>
                  <a href="/admin" className="text-purple-400 hover:underline">
                    → Go to Admin Panel
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
