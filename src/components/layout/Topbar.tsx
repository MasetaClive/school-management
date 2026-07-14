'use client';

import React from 'react';
import NotificationBell from './NotificationBell';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Topbar({ schoolName, user }: { schoolName?: string; user?: any }) {
    const router = useRouter();
    const supabase = createClient();
    const [showQuickAdd, setShowQuickAdd] = React.useState(false);
    const [showProfile, setShowProfile] = React.useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : 'AD';

    const quickActions = [
        { label: 'Student', href: '/admin/students/create', icon: '🎓' },
        { label: 'Teacher', href: '/admin/teachers/create', icon: '👨‍🏫' },
        { label: 'Parent', href: '/admin/parents/create', icon: '👥' },
        { label: 'Class', href: '/admin/classes/create', icon: '🏫' },
        { label: 'Announcement', href: '/admin/announcements', icon: '📣' },
    ];

    const [searchQuery, setSearchQuery] = React.useState('');
    const [results, setResults] = React.useState<{ students: any[], teachers: any[], classes: any[] }>({ students: [], teachers: [], classes: [] });
    const [isSearching, setIsSearching] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    React.useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                void performSearch();
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setResults({ students: [], teachers: [], classes: [] });
        }
    }, [searchQuery]);

    async function performSearch() {
        try {
            setIsSearching(true);
            const [sRes, tRes, cRes] = await Promise.all([
                fetch(`/api/admin/students?search=${encodeURIComponent(searchQuery)}`),
                fetch(`/api/admin/teachers?search=${encodeURIComponent(searchQuery)}`),
                fetch(`/api/admin/classes?search=${encodeURIComponent(searchQuery)}`)
            ]);
            
            const [sData, tData, cData] = await Promise.all([
                sRes.json(),
                tRes.json(),
                cRes.json()
            ]);

            setResults({
                students: (sData.data || []).slice(0, 3),
                teachers: (tData.data || []).slice(0, 3),
                classes: (cData.data || []).slice(0, 3)
            });
        } catch (e) {
            console.error('Global search failed', e);
        } finally {
            setIsSearching(false);
        }
    }

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
            {/* Global Search */}
            <div className="flex-1 max-w-xl relative">
                <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        {isSearching ? <span className="animate-spin inline-block">⌛</span> : '🔍'}
                    </span>
                    <input 
                        id="global-search"
                        type="search"
                        autoComplete="off"
                        placeholder="Search students, teachers, or classes (Ctrl + K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                </div>

                {/* Search Results Dropdown */}
                {searchQuery.length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[70vh] overflow-y-auto p-2">
                            {results.students.length > 0 && (
                                <div className="mb-4">
                                    <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</p>
                                    {results.students.map(s => (
                                        <a key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {s.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600">{s.full_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{s.student_id}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {results.teachers.length > 0 && (
                                <div className="mb-4">
                                    <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teachers</p>
                                    {results.teachers.map(t => (
                                        <a key={t.id} href={`/admin/teachers/${t.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {t.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 group-hover:text-emerald-600">{t.full_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{t.teacher_id}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {results.classes.length > 0 && (
                                <div>
                                    <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classes</p>
                                    {results.classes.map(c => (
                                        <a key={c.id} href={`/admin/classes/${c.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 group-hover:text-amber-600">{c.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{c.academic_year}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {results.students.length === 0 && results.teachers.length === 0 && results.classes.length === 0 && !isSearching && (
                                <p className="p-8 text-center text-xs text-slate-400 font-medium italic">No matches found for "{searchQuery}"</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        suppressHydrationWarning
                    >
                        <span className="text-sm">+</span> Quick Add
                    </button>

                    {showQuickAdd && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowQuickAdd(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                <p className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New</p>
                                {quickActions.map(action => (
                                    <a 
                                        key={action.href}
                                        href={action.href}
                                        className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                        onClick={() => setShowQuickAdd(false)}
                                    >
                                        <span className="text-lg">{action.icon}</span>
                                        {action.label}
                                    </a>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                
                <div className="h-8 w-px bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 relative">
                    <NotificationBell />
                    <div 
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                        suppressHydrationWarning
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
                            {initials}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-[10px] font-black uppercase text-slate-800 leading-tight">{user?.full_name || 'Admin User'}</p>
                            <p className="text-[9px] text-slate-400 leading-tight uppercase font-bold">{user?.role || 'Super Admin'}</p>
                        </div>
                        <span className="text-[8px] text-slate-400 ml-1">▼</span>
                    </div>

                    {showProfile && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-black text-slate-800 truncate">{user?.full_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <a href="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                    👤 My Profile
                                </a>
                                <a href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                    ⚙️ System Settings
                                </a>
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
