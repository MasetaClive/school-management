'use client';

import React from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { createClient } from '@/lib/supabase/client';

export default function StudentTopbar({ user, schoolName }: { user?: any, schoolName?: string }) {
    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: any) => n[0]).join('').toUpperCase()
        : 'S';

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex-1">
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Student Portal</h2>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="h-8 w-px bg-slate-200 mx-2" />
                
                <div className="flex items-center gap-3 group cursor-pointer relative">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase text-slate-800 leading-tight">{user?.full_name}</p>
                        <p className="text-[9px] text-indigo-500 leading-tight uppercase font-black italic">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                        {initials}
                    </div>

                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <Link href="/student/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                            👤 My Profile
                        </Link>
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                            suppressHydrationWarning
                        >
                            🚪 Logout Session
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
