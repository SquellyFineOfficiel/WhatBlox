import { createClient } from '@/src/lib/supabase/server';
import { getServerUser } from '@/src/lib/auth-server';
import DiscoveryPage from '@/src/components/discovery-page';

export default async function Discovery() {
  const supabase = await createClient();
  const user = await getServerUser();

  return <DiscoveryPage user={user} isConfigured={Boolean(supabase)} />;
}
