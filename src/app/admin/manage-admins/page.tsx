"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import AdminSidebar from '@/src/components/admin-sidebar';
import type { AdminRole } from '@/src/lib/admin';

interface AdminUser {
  id: string;
  role: AdminRole;
  email?: string;
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function ManageAdminsPage() {
  const [userRole, setUserRole] = useState<AdminRole>('moderator');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('reviewer');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const loadAdmins = async () => {
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

        // Load all admins
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          setMessage(`Error loading admins: ${error.message}`);
          setLoading(false);
          return;
        }

        // Fetch email for each admin from auth.users
        if (data) {
          const adminsWithEmails: AdminUser[] = [];
          for (const admin of data) {
            const { data: authUser, error: authError } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', admin.id)
              .maybeSingle();
            
            if (!authError) {
              adminsWithEmails.push({
                ...admin,
                email: authUser?.email || 'Unknown',
              });
            }
          }
          setAdmins(adminsWithEmails);
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadAdmins();
  }, [supabase]);

  const handleChangeRole = async (adminId: string, newRole: AdminRole) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRole })
        .eq('id', adminId);

      if (error) {
        setMessage(`Error updating role: ${error.message}`);
        return;
      }

      setAdmins(admins.map(admin => 
        admin.id === adminId ? { ...admin, role: newRole } : admin
      ));
      setMessage('✓ Admin role updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin? They will no longer have admin access.')) {
      return;
    }

    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) {
        setMessage(`Error removing admin: ${error.message}`);
        return;
      }

      setAdmins(admins.filter(admin => admin.id !== adminId));
      setMessage('✓ Admin removed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      setMessage('Please enter a Roblox user ID or username');
      return;
    }

    if (!supabase) return;

    setAddingAdmin(true);
    try {
      const userIdentifier = newAdminEmail.trim();
      let userId = '';

      // Check if it's a numeric Roblox ID
      if (/^\d+$/.test(userIdentifier)) {
        userId = userIdentifier;
      } else {
        // Try to find by username in games table (submitted games)
        const { data: gameUsers } = await supabase
          .from('games')
          .select('user_id')
          .eq('user_id', userIdentifier)
          .limit(1)
          .single();

        if (gameUsers?.user_id) {
          userId = gameUsers.user_id;
        } else {
          setMessage(`Error: User ID not found. Enter Roblox ID (numeric) or username of someone who submitted a game.`);
          setAddingAdmin(false);
          return;
        }
      }

      // Add as admin
      const { error } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          role: newAdminRole,
          permissions: ['view'],
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          setMessage('Error: This user is already an admin');
        } else {
          setMessage(`Error: ${error.message}`);
        }
        setAddingAdmin(false);
        return;
      }

      setAdmins([...admins, {
        id: userId,
        role: newAdminRole,
        email: userIdentifier,
        created_at: new Date().toISOString(),
      }]);

      setNewAdminEmail('');
      setNewAdminRole('reviewer');
      setMessage(`✓ User ${userIdentifier} (${userId}) added as ${newAdminRole}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setAddingAdmin(false);
    }
  };

  // Only super admins can access this page
  if (userRole && userRole !== 'super_admin') {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-black text-white">Access Denied</h1>
              <p className="mt-2 text-rbx-muted">Only super admins can manage admin roles</p>
            </div>
          </div>
          <AdminSidebar currentPage="manage-admins" userRole={userRole} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white">👑 Manage Admins</h1>
            <p className="mt-2 text-rbx-muted">Upgrade, downgrade, or remove admin users</p>
          </div>

          {/* Add New Admin Form */}
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Admin</h2>
            
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div>
                <label htmlFor="new-admin-identifier" className="block text-sm font-bold text-white mb-2">Roblox User ID or Username *</label>
                <input
                  id="new-admin-identifier"
                  type="text"
                  name="adminIdentifier"
                  autoComplete="off"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="12345 or username"
                  className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white placeholder-rbx-muted/50 transition focus:border-rbx-purple focus-visible:ring-2 focus-visible:ring-rbx-purple"
                />
                <p className="text-xs text-rbx-muted mt-2">Enter numeric Roblox ID or the username of someone who has submitted a game</p>
              </div>

              <div>
                <label htmlFor="new-admin-role" className="block text-sm font-bold text-white mb-2">Role</label>
                <select
                  id="new-admin-role"
                  name="newAdminRole"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-3 text-white transition focus:border-rbx-purple"
                >
                  <option value="reviewer">Reviewer (Review + Appeals)</option>
                  <option value="moderator">Moderator (All except admin mgmt)</option>
                  <option value="super_admin">Super Admin (Full access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addingAdmin}
                className="w-full rounded-xl bg-gradient-to-r from-rbx-purple to-rbx-red px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {addingAdmin ? 'Adding…' : '➕ Add Admin'}
              </button>
            </form>
          </div>

          {/* Current Admins List */}
          <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Current Admins</h2>
            
            {loading ? (
              <p className="text-rbx-muted">Loading admins…</p>
            ) : admins.length === 0 ? (
              <p className="text-rbx-muted">No admins found</p>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-rbx-border bg-rbx-surface-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{admin.email}</p>
                      <p className="text-xs text-rbx-muted">ID: {admin.id}</p>
                      <p className="text-xs text-rbx-muted">Added: {dateFormatter.format(new Date(admin.created_at))}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Change role for ${admin.email || admin.id}`}
                        value={admin.role}
                        onChange={(e) => handleChangeRole(admin.id, e.target.value as AdminRole)}
                        className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm font-semibold text-white transition focus:border-rbx-purple"
                      >
                        <option value="reviewer">Reviewer</option>
                        <option value="moderator">Moderator</option>
                        <option value="super_admin">Super Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="rounded-lg bg-rbx-red/20 px-3 py-2 text-sm font-semibold text-rbx-red transition hover:bg-rbx-red/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <p className={`text-center text-sm font-semibold ${message.includes('Error') ? 'text-rbx-red' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </div>

        <AdminSidebar currentPage="manage-admins" userRole={userRole} />
      </div>
    </main>
  );
}
