import { redirect } from 'next/navigation';
import { getAdminUser } from '@/src/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect('/');
  }

  return <>{children}</>;
}
