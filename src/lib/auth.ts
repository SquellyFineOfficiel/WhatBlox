/** Check whether a Roblox user ID belongs to an admin. Server-side only. */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.RBX_ADMIN_USER_IDS ?? process.env.ADMIN_ROBLOX_IDS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId);
}
