"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

interface Appeal {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response: string | null;
  created_at: string;
}

export default function AppealsPage() {
  const [userRole, setUserRole] = useState<AdminRole>('reviewer');
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
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

        const { data } = await supabase
          .from('appeals')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (data) {
          setAppeals(data as Appeal[]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApproveAppeal = async (appealId: string) => {
    const supabase = createClient();
    if (!supabase) return;

    setMessage('Processing...');
    const { error } = await supabase
      .from('appeals')
      .update({ status: 'approved', admin_response: response, reviewed_at: new Date().toISOString() })
      .eq('id', appealId);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setAppeals(appeals.filter((a) => a.id !== appealId));
      setSelectedAppeal(null);
      setResponse('');
      setMessage('✓ Appeal approved');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleRejectAppeal = async (appealId: string) => {
    const supabase = createClient();
    if (!supabase) return;

    setMessage('Processing...');
    const { error } = await supabase
      .from('appeals')
      .update({ status: 'rejected', admin_response: response, reviewed_at: new Date().toISOString() })
      .eq('id', appealId);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setAppeals(appeals.filter((a) => a.id !== appealId));
      setSelectedAppeal(null);
      setResponse('');
      setMessage('Appeal rejected.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">Appeals</h1>
            <p className="mt-2 text-rbx-muted">Review user appeals against moderation actions</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
              ))}
            </div>
          ) : appeals.length === 0 ? (
            <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
              <p className="text-lg font-bold text-white">All caught up! 🎉</p>
              <p className="mt-2 text-rbx-muted">No pending appeals to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appeals.map((appeal) => (
                <article
                  key={appeal.id}
                  onClick={() => setSelectedAppeal(appeal)}
                  className={`cursor-pointer rounded-2xl border transition p-6 ${
                    selectedAppeal?.id === appeal.id
                      ? 'border-rbx-orange bg-rbx-surface-2'
                      : 'border-rbx-border bg-rbx-surface hover:border-rbx-orange/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs px-3 py-1 rounded-lg bg-rbx-purple/20 text-rbx-purple font-bold">
                          {appeal.target_type === 'game' ? '🎮 Game Ban' : '🚫 User Ban'}
                        </span>
                        <span className="text-xs text-rbx-muted">
                          {new Date(appeal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-white line-clamp-2">{appeal.reason}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <AdminSidebar currentPage="appeals" userRole={userRole} />

          {selectedAppeal && (
            <div className="mt-8 rounded-2xl border border-rbx-border bg-rbx-surface p-6">
              <h3 className="font-bold text-white mb-4">Appeal Details</h3>
              <div className="space-y-4 mb-6 text-sm text-rbx-muted">
                <div>
                  <p className="text-xs text-rbx-muted/70 mb-1">Appeal Type</p>
                  <p className="text-white font-semibold">
                    {selectedAppeal.target_type === 'game' ? '🎮 Game Ban Appeal' : '🚫 User Ban Appeal'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-rbx-muted/70 mb-1">User's Appeal</p>
                  <p className="text-white text-sm">{selectedAppeal.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-rbx-muted/70 mb-2">Your Response</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Explain your decision..."
                  rows={4}
                  className="w-full rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm text-white placeholder-rbx-muted/50 transition focus:border-rbx-red"
                />
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => handleApproveAppeal(selectedAppeal.id)}
                  className="w-full rounded-lg bg-green-600/20 border border-green-600/50 px-4 py-2 text-sm font-bold text-green-400 hover:bg-green-600/30 transition"
                >
                  ✓ Approve Appeal
                </button>
                <button
                  onClick={() => handleRejectAppeal(selectedAppeal.id)}
                  className="w-full rounded-lg bg-rbx-red/20 border border-rbx-red/50 px-4 py-2 text-sm font-bold text-rbx-red hover:bg-rbx-red/30 transition"
                >
                  ✗ Deny Appeal
                </button>
              </div>

              {message && (
                <p className={`mt-4 text-center text-xs ${message.includes('Error') ? 'text-rbx-red' : 'text-green-400'}`}>
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
