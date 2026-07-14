import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  if (role !== 'teacher') redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Teacher Workspace" role="teacher" />
      <main className="p-6">{children}</main>
    </div>
  );
}
