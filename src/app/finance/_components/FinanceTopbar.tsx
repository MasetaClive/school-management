'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/layout/NotificationBell';
import { createClient } from '@/lib/supabase/client';

export default function FinanceTopbar({ schoolName, user }: { schoolName?: string; user?: any }) {
    const router = useRouter();
    const supabase = createClient();
    const [showProfile, setShowProfile] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : 'FI';

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
            {/* Global Search Placeholder for Finance */}
            <div className="flex-1 max-w-xl relative">
                <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        🔍
                    </span>
                    <input 
                        id="global-search"
                        type="search"
                        autoComplete="off"
                        placeholder="Search transactions, student accounts, or receipts (Ctrl + K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 relative">
                    <NotificationBell />
                    <div className="h-8 w-px bg-slate-200 mx-2" />
                    
                    <div 
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                        suppressHydrationWarning
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-black text-emerald-600">
                            {initials}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-[10px] font-black uppercase text-slate-800 leading-tight">{user?.full_name || 'Finance User'}</p>
                            <p className="text-[9px] text-slate-400 leading-tight uppercase font-bold">{user?.role || 'Finance Clerk'}</p>
                        </div>
                        <span className="text-[8px] text-slate-400 ml-1">▼</span>
                    </div>

                    {showProfile && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-black text-slate-800 truncate">{user?.full_name || 'Finance User'}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'finance@school.com'}</p>
                                </div>
                                <div className="h-px bg-slate-50 my-1" />
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    🚪 Logout Session
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
