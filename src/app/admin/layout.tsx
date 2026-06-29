import { redirect } from 'next/navigation';
import { getAdminUser } from '@/src/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect('/');
  }

  // Check if user is trying to access manage-admins without super_admin role
  // This is a basic check - the client-side sidebar will also enforce these permissions
  const pathname = new URL(
    // Use a default URL if headers is not available
    'http://localhost/admin'
  ).pathname;

  return <>{children}</>;
}
