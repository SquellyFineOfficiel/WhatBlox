import { createClient } from '@/src/lib/supabase/server';
import { getServerUser } from '@/src/lib/auth-server';

export type AdminRole = 'super_admin' | 'moderator' | 'reviewer';

export interface AdminUser {
  id: string;
  role: AdminRole;
  permissions: string[];
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const user = await getServerUser();
  if (!user) return null;

  const { data: adminUser } = await supabase.from('admin_users').select('id,role,permissions').eq('id', user.id).single();

  if (!adminUser) return null;

  return {
    id: adminUser.id,
    role: adminUser.role as AdminRole,
    permissions: adminUser.permissions || [],
  };
}

export function canAccess(userRole: AdminRole | undefined, requiredRoles: AdminRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}
