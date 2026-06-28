import { getVerifiedServerUser, type SignedSessionUser } from '@/src/lib/auth-session';

export type ServerUser = SignedSessionUser;

export async function getServerUser(): Promise<ServerUser | null> {
  return getVerifiedServerUser();
}