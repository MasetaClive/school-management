import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  if (role !== 'parent') redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Parent Portal" role="parent" />
      <main className="p-6">{children}</main>
    </div>
  );
}
