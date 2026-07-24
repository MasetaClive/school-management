'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from './NotificationBell';

type DashboardHeaderProps = {
    title: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
};

export default function DashboardHeader({ title, role }: DashboardHeaderProps) {
    const router = useRouter();
    const pathname = usePathname() || '';

    // Determine if we are on a subpage.
    // We show back button if the path has more than 2 segments (e.g., /admin/students)
    const segments = pathname.split('/').filter(Boolean);
    const isSubPage = segments.length > 1;
    const dashboardPath = `/${role || 'admin'}/dashboard`;

    return (
        <header className="border-b bg-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
                {isSubPage ? (
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-primary hover:text-white transition-all shadow-sm group"
                        title="Go Back"
                    >
                        <span className="text-xl font-bold group-hover:-translate-x-0.5 transition-transform">←</span>
                    </button>
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5">
                        <span className="text-lg">🏫</span>
                    </div>
                )}
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Link 
                            href={dashboardPath}
                            className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-colors"
                        >
                            {role} Dashboard
                        </Link>
                        {isSubPage && <span className="text-[10px] text-muted-foreground">/</span>}
                    </div>
                    <h1 className="text-xl font-black tracking-tight">{title}</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                {role === 'teacher' ? (
                    <Link 
                        href="/teacher/profile" 
                        className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary uppercase hover:bg-primary hover:text-white transition-colors"
                        title="View Profile"
                    >
                        T
                    </Link>
                ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary uppercase">
                        {role[0]}
                    </div>
                )}
            </div>
        </header>
    );
}
