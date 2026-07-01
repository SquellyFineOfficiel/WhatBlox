"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

export default function BanUsersPage() {
  const [userRole, setUserRole] = useState<AdminRole>('moderator');
  const [searchUserId, setSearchUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [expiresIn, setExpiresIn] = useState('permanent');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserRole = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        // Get current user's Roblox ID from cookies
        const clientUser = getClientUser();
        if (clientUser) {
          // Query admin_users with the Roblox ID
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', clientUser.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching admin role:', error);
          } else if (adminUser) {
            setUserRole(adminUser.role as AdminRole);
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();
  }, []);

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId.trim() || !banReason.trim()) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setMessage('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const expiresAt = expiresIn === 'permanent' ? null : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('banned_users').insert({
        id: searchUserId,
        reason: banReason,
        expires_at: expiresAt,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('✓ User banned successfully');
        setSearchUserId('');
        setBanReason('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Ban Users</h1>
            <p className="mt-2 text-rbx-muted">Manage banned users from the platform</p>
          </div>

          <form onSubmit={handleBanUser} className="max-w-2xl rounded-2xl border border-rbx-border bg-rbx-surface p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="banned-user-id" className="block text-sm font-bold text-white mb-2">User ID *</label>
                <input
                  id="banned-user-id"
                  type="text"
                  name="userId"
                  autoComplete="off"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  placeholder="Enter user UUID"
                  className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
                />
              </div>

              <div>
                <label htmlFor="ban-user-reason" className="block text-sm font-bold text-white mb-2">Ban Reason *</label>
                <textarea
                  id="ban-user-reason"
                  name="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned…"
                  rows={4}
                  className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-red focus-visible:ring-2 focus-visible:ring-rbx-red"
                />
              </div>

              <div>
                <label htmlFor="ban-user-duration" className="block text-sm font-bold text-white mb-2">Duration</label>
                <select
                  id="ban-user-duration"
                  name="banDuration"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white transition focus:border-rbx-red"
                >
                  <option value="permanent">Permanent</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Banning…' : '🚫 Ban User'}
              </button>
            </div>

            {message && (
              <p className={`mt-6 text-center text-sm ${message.includes('Error') ? 'text-rbx-red' : 'text-green-400'}`}>
                {message}
              </p>
            )}
          </form>
        </div>

        <AdminSidebar currentPage="ban-users" userRole={userRole} />
      </div>
    </main>
  );
}
