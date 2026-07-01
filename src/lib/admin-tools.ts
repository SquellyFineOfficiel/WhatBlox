import type { AdminRole } from '@/src/lib/admin';

export type AdminTool = {
  key: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  color: string;
  requiredRoles: AdminRole[];
  group: 'moderation' | 'insights' | 'system';
};

export const ADMIN_TOOLS: AdminTool[] = [
  {
    key: 'review',
    label: 'Review Games',
    icon: '📋',
    description: 'Approve or reject submissions in review.',
    href: '/admin/review',
    color: 'from-blue-600/25 to-cyan-500/25',
    requiredRoles: ['super_admin', 'reviewer'],
    group: 'moderation',
  },
  {
    key: 'queue',
    label: 'Submission Queue',
    icon: '⏱️',
    description: 'Process newly submitted games quickly.',
    href: '/admin/queue',
    color: 'from-indigo-600/25 to-blue-500/25',
    requiredRoles: ['super_admin', 'moderator', 'reviewer'],
    group: 'moderation',
  },
  {
    key: 'appeals',
    label: 'Appeals',
    icon: '🔔',
    description: 'Review and respond to pending appeals.',
    href: '/admin/appeals',
    color: 'from-amber-500/25 to-orange-500/25',
    requiredRoles: ['super_admin', 'moderator', 'reviewer'],
    group: 'moderation',
  },
  {
    key: 'ban-users',
    label: 'Ban Users',
    icon: '🚫',
    description: 'Apply or revoke user restrictions.',
    href: '/admin/ban-users',
    color: 'from-red-600/25 to-pink-500/25',
    requiredRoles: ['super_admin', 'moderator'],
    group: 'moderation',
  },
  {
    key: 'ban-games',
    label: 'Ban Games',
    icon: '🎮',
    description: 'Restrict harmful or policy-violating games.',
    href: '/admin/ban-games',
    color: 'from-orange-600/25 to-red-500/25',
    requiredRoles: ['super_admin', 'moderator'],
    group: 'moderation',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: '📊',
    description: 'Track platform health and moderation outcomes.',
    href: '/admin/analytics',
    color: 'from-purple-600/25 to-violet-500/25',
    requiredRoles: ['super_admin', 'moderator'],
    group: 'insights',
  },
  {
    key: 'logs',
    label: 'Moderation Logs',
    icon: '📝',
    description: 'Audit all admin actions and timeline entries.',
    href: '/admin/logs',
    color: 'from-cyan-600/25 to-sky-500/25',
    requiredRoles: ['super_admin', 'moderator'],
    group: 'insights',
  },
  {
    key: 'bulk-tools',
    label: 'Bulk Tools',
    icon: '🧰',
    description: 'Run high-volume actions with full audit trail.',
    href: '/admin/bulk-tools',
    color: 'from-teal-600/25 to-emerald-500/25',
    requiredRoles: ['super_admin', 'moderator'],
    group: 'system',
  },
  {
    key: 'manage-admins',
    label: 'Manage Admins',
    icon: '👑',
    description: 'Invite admins and update access roles.',
    href: '/admin/manage-admins',
    color: 'from-pink-600/25 to-purple-500/25',
    requiredRoles: ['super_admin'],
    group: 'system',
  },
];

export function isToolAccessible(userRole: AdminRole, tool: AdminTool): boolean {
  return tool.requiredRoles.includes(userRole);
}

export function getAccessibleAdminTools(userRole: AdminRole): AdminTool[] {
  return ADMIN_TOOLS.filter((tool) => isToolAccessible(userRole, tool));
}
