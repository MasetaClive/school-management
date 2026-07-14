import { redirect } from 'next/navigation';
import { getUserRole, getUserProfile } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { SettingsService } from '@/modules/settings/settings.service';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  if (role !== 'admin') redirect('/login');

  const [schoolInfo, userProfile] = await Promise.all([
    SettingsService.getSettings('school_info'),
    getUserProfile()
  ]);

  const schoolName = schoolInfo?.name || 'ANTIGRAVITY';

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans antialiased text-slate-900">
      {/* Sidebar - Fixed width */}
      <Sidebar schoolName={schoolName} />
      
      {/* Main Content - Flex-1 with margin for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 pl-64">
        <Topbar schoolName={schoolName} user={userProfile} />
        <main className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
