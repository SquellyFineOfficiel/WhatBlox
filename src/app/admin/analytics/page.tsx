"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

interface Stats {
  totalGames: number;
  approvedGames: number;
  reviewGames: number;
  rejectedGames: number;
  totalUsers: number;
  bannedUsers: number;
  totalVotes: number;
}

export default function AnalyticsPage() {
  const [userRole, setUserRole] = useState<AdminRole>('moderator');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Get current user's Roblox ID from cookies
        const clientUser = getClientUser();
        if (clientUser) {
          // Query admin_users with the Roblox ID
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', clientUser.id)
            .single();

          if (adminUser) {
            setUserRole(adminUser.role as AdminRole);
          }
        }

        // Get game stats
        const { count: totalGames } = await supabase.from('games').select('id', { count: 'exact' });
        const { count: approvedGames } = await supabase
          .from('games')
          .select('id', { count: 'exact' })
          .eq('status', 'approved');
        const { count: reviewGames } = await supabase
          .from('games')
          .select('id', { count: 'exact' })
          .eq('status', 'review');
        const { count: rejectedGames } = await supabase
          .from('games')
          .select('id', { count: 'exact' })
          .eq('status', 'rejected');

        // Get user stats
        const { count: totalUsers } = await supabase.from('auth.users').select('id', { count: 'exact' });
        const { count: bannedUsers } = await supabase
          .from('banned_users')
          .select('id', { count: 'exact' })
          .eq('is_active', true);

        // Get vote stats
        const { count: totalVotes } = await supabase.from('votes').select('id', { count: 'exact' });

        setStats({
          totalGames: totalGames || 0,
          approvedGames: approvedGames || 0,
          reviewGames: reviewGames || 0,
          rejectedGames: rejectedGames || 0,
          totalUsers: totalUsers || 0,
          bannedUsers: bannedUsers || 0,
          totalVotes: totalVotes || 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }

      setLoading(false);
    };

    loadStats();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Analytics</h1>
            <p className="mt-2 text-rbx-muted">Platform statistics and insights</p>
          </div>

          {loading ? (
            <div className="text-rbx-muted">Loading...</div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Games Section */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">📋 Games</h2>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Total</p>
                    <p className="mt-3 text-4xl font-black text-white">{stats.totalGames}</p>
                  </div>
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-green-400">Approved</p>
                    <p className="mt-3 text-4xl font-black text-green-400">{stats.approvedGames}</p>
                  </div>
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-yellow-400">In Review</p>
                    <p className="mt-3 text-4xl font-black text-yellow-400">{stats.reviewGames}</p>
                  </div>
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-rbx-red">Rejected</p>
                    <p className="mt-3 text-4xl font-black text-rbx-red">{stats.rejectedGames}</p>
                  </div>
                </div>
              </div>

              {/* Users Section */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">👥 Users</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Total Users</p>
                    <p className="mt-3 text-4xl font-black text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-rbx-red">Banned Users</p>
                    <p className="mt-3 text-4xl font-black text-rbx-red">{stats.bannedUsers}</p>
                  </div>
                </div>
              </div>

              {/* Activity Section */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">🗳️ Activity</h2>
                <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-rbx-muted">Total Votes</p>
                  <p className="mt-3 text-4xl font-black text-white">{stats.totalVotes}</p>
                  <p className="mt-4 text-sm text-rbx-muted">
                    Avg per game: {stats.totalGames > 0 ? Math.round(stats.totalVotes / stats.totalGames * 10) / 10 : 0}
                  </p>
                </div>
              </div>

              {/* Health Check */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">✓ Platform Health</h2>
                <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Approval Rate</span>
                    <span className="font-bold text-green-400">
                      {stats.approvedGames + stats.rejectedGames > 0
                        ? Math.round((stats.approvedGames / (stats.approvedGames + stats.rejectedGames)) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Pending Review</span>
                    <span className="font-bold text-yellow-400">{stats.reviewGames}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Ban Rate</span>
                    <span className="font-bold text-rbx-red">
                      {stats.totalUsers > 0 ? Math.round((stats.bannedUsers / stats.totalUsers) * 100 * 10) / 10 : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-rbx-muted">Failed to load statistics</div>
          )}
        </div>

        <AdminSidebar currentPage="analytics" userRole={userRole} />
      </div>
    </main>
  );
}
