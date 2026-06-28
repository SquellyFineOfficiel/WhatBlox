'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const makeAdmin = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin-setup', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to make you admin');
        return;
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-rbx-border bg-rbx-surface p-10">
        <h1 className="text-3xl font-black text-white">Admin Setup</h1>
        <p className="mt-4 text-rbx-muted">Click the button below to make yourself a super admin (temporary setup).</p>

        <div className="mt-8 space-y-4">
          <button
            onClick={makeAdmin}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {loading ? 'Making you admin...' : 'Make Me Admin'}
          </button>

          {message && (
            <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
              <p className="text-green-400 font-bold">✓ {message}</p>
              <p className="text-sm text-green-300 mt-2">Redirecting to dashboard...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-red-400 font-bold">✗ {error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
          <h2 className="font-bold text-white">⚠️ Warning</h2>
          <p className="mt-2 text-sm text-rbx-muted">
            This page should only be used for development/testing. Delete this page before going to production.
          </p>
        </div>
      </div>
    </main>
  );
}
