'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: '🏠' },
    { label: 'My Classes', href: '/student/classes', icon: '📚' },
    { label: 'Homework', href: '/student/homework', icon: '✍️' },
    { label: 'Results', href: '/student/results', icon: '📊' },
    { label: 'Library', href: '/student/library', icon: '📖' },
    { label: 'Messages', href: '/messages', icon: '✉️' },
    { label: 'Settings', href: '/student/settings', icon: '⚙️' },
];

export default function StudentSidebar({ schoolName }: { schoolName?: string }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 min-h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 shadow-2xl`}>
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between">
                {!collapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-500">
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                            A
                        </div>
                        <span className="font-black text-white tracking-tighter uppercase italic text-sm">
                            {schoolName || 'Antigravity'}
                        </span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black mx-auto">
                        A
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className={`text-xl transition-transform group-hover:scale-120 ${collapsed ? 'mx-auto' : ''}`}>
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span className="font-black uppercase tracking-widest text-[10px] italic">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    suppressHydrationWarning
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>
        </aside>
    );
}
