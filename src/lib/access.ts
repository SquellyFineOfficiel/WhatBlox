import { isAdmin } from '@/src/lib/auth';

export function isAdminUserId(userId: string | null | undefined) {
  return isAdmin(userId);
}