import { createClient } from '@/src/lib/supabase/server';
import { getServerUser } from '@/src/lib/auth-server';
import HomePage from '@/src/components/home-page';

export default async function Home() {
  const supabase = await createClient();
  const user = await getServerUser();

  return <HomePage user={user} isConfigured={Boolean(supabase)} />;
}
