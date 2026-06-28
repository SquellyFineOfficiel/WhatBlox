export type ClientUser = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export function getClientUser(): ClientUser | null {
  if (typeof document === 'undefined') return null;

  const get = (name: string) =>
    document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${name}=`))
      ?.split('=')
      .slice(1)
      .join('=') ?? null;

  const id = get('rbx_user_id');
  if (!id) return null;

  return {
    id,
    name: get('rbx_user_name'),
    avatarUrl: get('rbx_user_avatar'),
  };
}