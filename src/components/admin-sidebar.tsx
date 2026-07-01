import Link from 'next/link';
import type { AdminRole } from '@/src/lib/admin';
import { ADMIN_TOOLS, isToolAccessible } from '@/src/lib/admin-tools';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  moderator: 'Moderator',
  reviewer: 'Reviewer',
};

interface AdminSidebarProps {
  currentPage: string;
  userRole?: AdminRole;
}

export default function AdminSidebar({ currentPage, userRole = 'reviewer' }: AdminSidebarProps) {
  return (
    <aside className="w-full rounded-2xl border border-rbx-border bg-rbx-surface p-5 md:w-72 md:sticky md:top-24 md:h-fit">
      <div className="mb-5 rounded-xl border border-rbx-border bg-rbx-surface-2 p-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-rbx-muted">Admin panel</h3>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-rbx-border/70 bg-rbx-surface px-3 py-2 text-xs font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-rbx-orange" />
          {ROLE_LABELS[userRole]}
        </div>
      </div>

      <nav className="space-y-2">
        {ADMIN_TOOLS.map((tool) => {
          const canAccess = isToolAccessible(userRole, tool);

          if (!canAccess) {
            return (
              <div
                key={tool.key}
                className="flex items-center justify-between rounded-xl border border-rbx-border/60 px-3 py-2.5 text-sm text-rbx-muted/45 opacity-60"
                title="You don't have permission to access this tool"
              >
                <span className="truncate">{tool.icon} {tool.label}</span>
                <span className="ml-2 rounded-md border border-rbx-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Locked
                </span>
              </div>
            );
          }

          const isActive = currentPage === tool.key;

          return (
            <Link
              key={tool.key}
              href={tool.href}
              className={`block rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-transparent bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                  : 'border-rbx-border text-rbx-muted hover:border-white/20 hover:text-white hover:bg-rbx-surface-2'
              }`}
            >
              {tool.icon} {tool.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 space-y-2 border-t border-rbx-border pt-4">
        <Link
          href="/admin"
          className="block rounded-lg px-2 text-xs font-semibold text-rbx-muted transition hover:text-white"
        >
          Admin home
        </Link>
        <Link
          href="/"
          className="block rounded-lg px-2 text-xs font-semibold text-rbx-muted transition hover:text-white"
        >
          ← Back to home
        </Link>
      </div>
    </aside>
  );
}
