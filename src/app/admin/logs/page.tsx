"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

interface Log {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
}

export default function LogsPage() {
  const [userRole, setUserRole] = useState<AdminRole>('moderator');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Get current user role
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (adminUser) {
          setUserRole(adminUser.role as AdminRole);
        }
      }

      let query = supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data } = await query;
      if (data) {
        setLogs(data as Log[]);
      }
      setLoading(false);
    };

    loadLogs();
  }, [filter]);

  const getActionBadge = (action: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      game_approved: { bg: 'bg-green-600/20', text: 'text-green-400' },
      game_rejected: { bg: 'bg-rbx-red/20', text: 'text-rbx-red' },
      game_banned: { bg: 'bg-rbx-red/30', text: 'text-rbx-red' },
      user_banned: { bg: 'bg-rbx-red/20', text: 'text-rbx-red' },
      user_unbanned: { bg: 'bg-green-600/20', text: 'text-green-400' },
      appeal_reviewed: { bg: 'bg-rbx-purple/20', text: 'text-rbx-purple' },
    };
    const badge = badges[action] || { bg: 'bg-rbx-surface-2', text: 'text-rbx-muted' };
    return badge;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      game_approved: '✓ Game Approved',
      game_rejected: '✗ Game Rejected',
      game_banned: '🎮 Game Banned',
      user_banned: '🚫 User Banned',
      user_unbanned: '✓ User Unbanned',
      appeal_reviewed: '🔔 Appeal Reviewed',
    };
    return labels[action] || action;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Moderation Logs</h1>
            <p className="mt-2 text-rbx-muted">Audit trail of all moderation actions</p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-rbx-border bg-rbx-surface-2 text-white text-sm font-semibold"
            >
              <option value="all">All Actions</option>
              <option value="game_approved">Game Approved</option>
              <option value="game_rejected">Game Rejected</option>
              <option value="game_banned">Game Banned</option>
              <option value="user_banned">User Banned</option>
            </select>
          </div>

          {/* Logs */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
              <p className="text-rbx-muted">No moderation logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                const dateStr = new Date(log.created_at).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-rbx-border bg-rbx-surface p-6 hover:bg-rbx-surface-2 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-lg text-xs font-bold`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-rbx-muted">{dateStr}</span>
                        </div>
                        <p className="text-sm text-rbx-muted">
                          <span className="font-semibold text-white">Target:</span> {log.target_id}
                        </p>
                        {log.reason && (
                          <p className="mt-2 text-sm text-rbx-muted">
                            <span className="font-semibold text-white">Reason:</span> {log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AdminSidebar currentPage="logs" userRole={userRole} />
      </div>
    </main>
  );
}
