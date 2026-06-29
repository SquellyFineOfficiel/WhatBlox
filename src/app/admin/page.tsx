'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/src/lib/supabase/client';
import { getClientUser } from '@/src/lib/auth-client';
import type { AdminRole } from '@/src/lib/admin';

type AdminTool = {
  key: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  color: string;
  requiredRoles: AdminRole[];
};

const tools: AdminTool[] = [
  {
    key: 'review',
    label: 'Review Games',
    icon: '📋',
    description: 'Approve or reject pending submissions',
    href: '/admin/review',
    color: 'from-blue-600 to-blue-800',
    requiredRoles: ['super_admin', 'reviewer'],
  },
  {
    key: 'ban-users',
    label: 'Ban Users',
    icon: '🚫',
    description: 'Manage user bans',
    href: '/admin/ban-users',
    color: 'from-red-600 to-red-800',
    requiredRoles: ['super_admin', 'moderator'],
  },
  {
    key: 'ban-games',
    label: 'Ban Games',
    icon: '🎮',
    description: 'Manage game restrictions',
    href: '/admin/ban-games',
    color: 'from-orange-600 to-orange-800',
    requiredRoles: ['super_admin', 'moderator'],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: '📊',
    description: 'View platform statistics',
    href: '/admin/analytics',
    color: 'from-purple-600 to-purple-800',
    requiredRoles: ['super_admin', 'moderator'],
  },
  {
    key: 'logs',
    label: 'Moderation Logs',
    icon: '📝',
    description: 'View moderation history',
    href: '/admin/logs',
    color: 'from-cyan-600 to-cyan-800',
    requiredRoles: ['super_admin', 'moderator'],
  },
  {
    key: 'appeals',
    label: 'Appeals',
    icon: '🔔',
    description: 'Review user appeals',
    href: '/admin/appeals',
    color: 'from-amber-600 to-amber-800',
    requiredRoles: ['super_admin', 'moderator', 'reviewer'],
  },
  {
    key: 'manage-admins',
    label: 'Manage Admins',
    icon: '👑',
    description: 'Admin user management',
    href: '/admin/manage-admins',
    color: 'from-pink-600 to-pink-800',
    requiredRoles: ['super_admin'],
  },
];

export default function AdminPage() {
  const [userRole, setUserRole] = useState<AdminRole>('reviewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const clientUser = getClientUser();
        if (clientUser) {
          const { data: admin, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', clientUser.id)
            .maybeSingle();

          if (!error && admin) {
            setUserRole(admin.role as AdminRole);
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  const accessibleTools = tools.filter((tool) => tool.requiredRoles.includes(userRole));

  return (
    <main className="min-h-screen bg-gradient-to-br from-rbx-background via-rbx-background to-rbx-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6">
            <h1 className="text-5xl font-black bg-gradient-to-r from-rbx-orange via-rbx-red to-rbx-orange bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-rbx-muted">
            Welcome, <span className="capitalize font-bold text-rbx-orange">{userRole}</span>
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin">
              <div className="h-12 w-12 border-4 border-rbx-border border-t-rbx-orange rounded-full" />
            </div>
          </div>
        )}

        {/* Tools Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {accessibleTools.map((tool) => (
              <Link key={tool.key} href={tool.href}>
                <div
                  className={`group relative h-48 rounded-2xl bg-gradient-to-br ${tool.color} p-1 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                >
                  {/* Gradient Background Card */}
                  <div className="relative h-full rounded-2xl bg-rbx-surface p-6 flex flex-col justify-between transition-all duration-300 group-hover:bg-rbx-surface/80">
                    {/* Icon */}
                    <div className="text-4xl mb-4 transition-transform group-hover:scale-110">
                      {tool.icon}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rbx-orange transition-colors">
                        {tool.label}
                      </h3>
                      <p className="text-sm text-rbx-muted group-hover:text-rbx-muted/80 transition-colors">
                        {tool.description}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="absolute top-6 right-6 text-2xl opacity-0 transition-all group-hover:opacity-100">
                      →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && accessibleTools.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-rbx-muted">No tools available for your role.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rbx-surface hover:bg-rbx-surface-2 border border-rbx-border text-rbx-muted hover:text-white transition-all"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
