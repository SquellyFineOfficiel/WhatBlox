import { createClient } from '@/src/lib/supabase/server';
import { isAdmin } from '@/src/lib/auth';

export type RobloxProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

export async function getServerProfile(userId: string | null | undefined): Promise<RobloxProfile | null> {
  if (!userId) {
    return null;
  }

  const supabase = await createClient();
  if (!supabase) {
    return isAdmin(userId)
      ? { id: userId, display_name: null, avatar_url: null, role: 'admin' }
      : { id: userId, display_name: null, avatar_url: null, role: 'user' };
  }

  const { data } = await supabase
    .from('profiles')
    .select('id,display_name,avatar_url,role')
    .eq('id', userId)
    .maybeSingle();

  if (data) {
    return data as RobloxProfile;
  }

  return isAdmin(userId)
    ? { id: userId, display_name: null, avatar_url: null, role: 'admin' }
    : { id: userId, display_name: null, avatar_url: null, role: 'user' };
}

export async function isAdminServerUser(userId: string | null | undefined) {
  if (!userId) {
    return false;
  }

  const profile = await getServerProfile(userId);
  return profile?.role === 'admin' || isAdmin(userId);
}