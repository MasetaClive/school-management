'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarItemProps = {
    icon: React.ReactNode;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
};

const SidebarItem = ({ icon, label, href, active, collapsed }: SidebarItemProps) => (
    <Link 
        href={href}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            active 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <div className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
            {icon}
        </div>
        {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
        {collapsed && (
            <div className="fixed left-16 ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-black uppercase z-50 whitespace-nowrap">
                {label}
            </div>
        )}
    </Link>
);

export default function FinanceSidebar({ schoolName }: { schoolName?: string }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname() || '';
    const name = schoolName || 'ANTIGRAVITY';

    const groups = [
        {
            title: 'Portal Home',
            items: [
                { label: 'Dashboard', href: '/finance/dashboard', icon: <span className="text-lg">📊</span> },
            ]
        },
        {
            title: 'Fee Operations',
            items: [
                { label: 'Record Payment', href: '/finance/record-payment', icon: <span className="text-lg">💵</span> },
                { label: 'Fee Structures', href: '/finance/fee-structures', icon: <span className="text-lg">📝</span> },
                { label: 'Fee Types', href: '/finance/fee-types', icon: <span className="text-lg">🏷️</span> },
            ]
        },
        {
            title: 'Accounts & Docs',
            items: [
                { label: 'Student Accounts', href: '/finance/student-accounts', icon: <span className="text-lg">👥</span> },
                { label: 'Receipts', href: '/finance/receipts', icon: <span className="text-lg">🧾</span> },
                { label: 'Reports', href: '#reports', icon: <span className="text-lg">📈</span> },
            ]
        }
    ];

    return (
        <aside 
            className={`fixed left-0 top-0 h-screen bg-[#0F172A] border-r border-slate-800 transition-all duration-300 z-50 flex flex-col ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            <div className="p-6 flex items-center justify-between">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/50 uppercase">
                            $
                        </div>
                        <div>
                            <span className="text-white font-black text-sm tracking-tight block leading-none">FINANCE</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{name}</span>
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors ml-auto"
                    suppressHydrationWarning
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
                {groups.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                        {!collapsed && (
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-3">
                                {group.title}
                            </h4>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <SidebarItem 
                                    key={item.label}
                                    {...item}
                                    active={pathname === item.href || (item.href !== '#' && !item.href.startsWith('#') && pathname.startsWith(item.href + '/'))}
                                    collapsed={collapsed}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                        AD
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate font-sans">Finance Officer</p>
                            <p className="text-[10px] text-slate-500 truncate font-sans">finance@school.com</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
