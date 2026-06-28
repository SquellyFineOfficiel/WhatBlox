import Link from 'next/link';

export type AdminRole = 'super_admin' | 'moderator' | 'reviewer';

export const toolPermissions: Record<string, AdminRole[]> = {
  'review': ['super_admin', 'reviewer'],
  'ban-users': ['super_admin', 'moderator'],
  'ban-games': ['super_admin', 'moderator'],
  'analytics': ['super_admin', 'moderator'],
  'logs': ['super_admin', 'moderator'],
  'appeals': ['super_admin', 'moderator', 'reviewer'],
  'manage-admins': ['super_admin'],
};

interface AdminSidebarProps {
  currentPage: string;
  userRole?: AdminRole;
}

export default function AdminSidebar({ currentPage, userRole = 'reviewer' }: AdminSidebarProps) {
  const isAccessible = (toolKey: string) => {
    const allowedRoles = toolPermissions[toolKey] || [];
    return allowedRoles.includes(userRole);
  };

  const tools = [
    { key: 'review', label: '📋 Review Games', href: '/admin/review' },
    { key: 'ban-users', label: '🚫 Ban Users', href: '/admin/ban-users' },
    { key: 'ban-games', label: '🎮 Ban Games', href: '/admin/ban-games' },
    { key: 'analytics', label: '📊 Analytics', href: '/admin/analytics' },
    { key: 'logs', label: '📝 Moderation Logs', href: '/admin/logs' },
    { key: 'appeals', label: '🔔 Appeals', href: '/admin/appeals' },
    { key: 'manage-admins', label: '👑 Manage Admins', href: '/admin/manage-admins' },
  ];

  return (
    <aside className="w-full md:w-64 rounded-2xl border border-rbx-border bg-rbx-surface p-6 md:sticky md:top-24 md:h-fit">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-rbx-muted mb-2">Admin Tools</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rbx-surface-2 text-xs font-semibold text-rbx-muted">
          <span className="capitalize">{userRole}</span>
        </div>
      </div>

      <nav className="space-y-2">
        {tools.map((tool) => {
          const canAccess = isAccessible(tool.key);

          if (!canAccess) {
            return (
              <div
                key={tool.key}
                className="px-4 py-3 rounded-xl text-sm text-rbx-muted/50 cursor-not-allowed opacity-50"
                title="You don't have permission to access this tool"
              >
                {tool.label}
              </div>
            );
          }

          const isActive = currentPage === tool.key;

          return (
            <Link
              key={tool.key}
              href={tool.href}
              className={`block px-4 py-3 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                  : 'text-rbx-muted hover:text-white hover:bg-rbx-surface-2'
              }`}
            >
              {tool.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-rbx-border">
        <Link
          href="/"
          className="text-xs font-semibold text-rbx-muted hover:text-white transition"
        >
          ← Back to home
        </Link>
      </div>
    </aside>
  );
}
