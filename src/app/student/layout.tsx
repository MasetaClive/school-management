import { redirect } from 'next/navigation';
import { getUserRole, getUserProfile } from '@/lib/auth';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentTopbar from '@/components/layout/StudentTopbar';
import { SettingsService } from '@/modules/settings/settings.service';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  if (role !== 'student') redirect('/login');

  const [schoolInfo, userProfile] = await Promise.all([
    SettingsService.getSettings('school_info'),
    getUserProfile()
  ]);

  const schoolName = schoolInfo?.name || 'ANTIGRAVITY';

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans antialiased text-slate-900">
      <StudentSidebar schoolName={schoolName} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 pl-64">
        <StudentTopbar schoolName={schoolName} user={userProfile} />
        <main className="p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-50/50 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
