'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

type AdminAction = {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<string>('all');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [selectedAction, setSelectedAction] = useState('ban_game');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get current user and check admin status
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUser({ id: data.user.id });

        // Check if admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (adminData) {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } else {
        router.push('/auth');
      }
    });
  }, [router]);

  // Load admin actions
  useEffect(() => {
    if (!isAdmin) return;

    const loadActions = async () => {
      try {
        const url = new URL('/api/admin/actions', window.location.origin);
        if (actionType !== 'all') {
          url.searchParams.set('type', actionType);
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setActions(data.actions);
        }
      } catch (err) {
        console.error('Error loading actions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActions();
  }, [isAdmin, actionType]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !reason.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          targetType: selectedAction.includes('game') ? 'game' : selectedAction.includes('user') ? 'user' : 'content',
          targetId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute action');
      }

      setSuccess('Action executed successfully!');
      setTargetId('');
      setReason('');

      // Reload actions
      const url = new URL('/api/admin/actions', window.location.origin);
      const actionsResponse = await fetch(url);
      const newData = await actionsResponse.json();
      setActions(newData.actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-center text-rbx-muted">Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">Admin Dashboard</h1>
        <p className="mt-2 text-rbx-muted">Manage games, users, and content</p>
      </div>

      {/* Action Form */}
      <div className="mb-8 rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Execute Admin Action</h2>
        <form onSubmit={handleExecuteAction} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-white focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
              >
                <option value="ban_game">Ban Game</option>
                <option value="unban_game">Unban Game</option>
                <option value="ban_user">Ban User</option>
                <option value="unban_user">Unban User</option>
                <option value="delete_content">Delete Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Target ID</label>
              <input
                type="text"
                name="targetId"
                autoComplete="off"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Game/User/Content ID"
                className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-4 py-2 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is necessary…"
              className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-4 py-2 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
              rows={3}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-rbx-muted">{reason.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Executing…' : 'Execute Action'}
          </button>
        </form>
      </div>

      {/* Action History */}
      <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Action History</h2>

        <div className="mb-4">
          <label className="text-sm font-semibold text-rbx-muted">Filter by type:</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="mt-2 rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
          >
            <option value="all">All Actions</option>
            <option value="ban_game">Ban Game</option>
            <option value="unban_game">Unban Game</option>
            <option value="ban_user">Ban User</option>
            <option value="unban_user">Unban User</option>
            <option value="delete_content">Delete Content</option>
          </select>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-rbx-border/30 bg-rbx-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white capitalize">{action.action_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-rbx-muted">
                      Target: {action.target_type} {action.target_id.slice(0, 8)}...
                    </p>
                    <p className="mt-1 text-sm text-rbx-muted">{action.reason}</p>
                  </div>
                  <span className="text-xs text-rbx-muted">
                    {dateFormatter.format(new Date(action.created_at))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-rbx-muted">No actions found</p>
        )}
      </div>
    </main>
  );
}
