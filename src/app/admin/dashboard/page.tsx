'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';

type DashboardStats = {
    students: number;
    teachers: number;
    classes: number;
    parents: number;
    attendance: number;
    trends: {
        students: { value: number; isPositive: boolean };
        teachers: { value: number; isPositive: boolean };
        attendance: { value: number; isPositive: boolean };
    };
    upcomingEvents: Array<{
        id: string;
        title: string;
        date: string;
        category: string;
    }>;
    recentActivity: Array<{
        type: string;
        message: string;
        date: string;
        icon: string;
    }>;
};

function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

const ToolCard = ({ href, icon, title, description, color }: any) => (
    <Link href={href} className="group relative p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{description}</p>
            </div>
        </div>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">→</span>
    </Link>
);

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error('Failed to load dashboard stats', e);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const tools = [
        { title: 'Finance', href: '/admin/finance', icon: '💰', description: 'Fees, Payroll & Tracking', color: 'indigo' },
        { title: 'Library', href: '/admin/library', icon: '📖', description: 'Catalog & Borrowing', color: 'emerald' },
        { title: 'Assets', href: '/admin/assets', icon: '📦', description: 'Inventory & School Assets', color: 'amber' },
        { title: 'Transport', href: '/admin/transport', icon: '🚌', description: 'Logistics & Route Management', color: 'blue' },
        { title: 'Timetables', href: '/admin/timetables', icon: '🗓️', description: 'Schedule & Slot Management', color: 'purple' },
        { title: 'Reports', href: '/admin/reports', icon: '📊', description: 'Academic & Admin Analytics', color: 'rose' },
        { title: 'Rollover', href: '/admin/rollover', icon: '🔄', description: 'Academic Year Transition', color: 'orange' },
        { title: 'Announcements', href: '/admin/announcements', icon: '📣', description: 'School-wide Notices', color: 'sky' },
        { title: 'Settings', href: '/admin/settings', icon: '⚙️', description: 'Full System Config', color: 'slate' },
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Institutional Intelligence</h2>
                    <p className="text-slate-500 font-medium font-sans">Real-time overview of your school's vital signs.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 uppercase tracking-widest text-slate-400">
                    <span className="text-emerald-500 animate-pulse">●</span> LIVE SYSTEM STATUS
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Students" 
                    value={loading ? '...' : stats?.students || 0} 
                    icon={<span>🎓</span>} 
                    trend={stats?.trends?.students}
                    color="indigo"
                    description="Total currently enrolled students"
                />
                <StatCard 
                    title="Faculty Members" 
                    value={loading ? '...' : stats?.teachers || 0} 
                    icon={<span>👨‍🏫</span>} 
                    trend={stats?.trends?.teachers}
                    color="blue"
                    description="Verified teaching staff"
                />
                <StatCard 
                    title="Attendance Today" 
                    value={loading ? '...' : `${stats?.attendance || 0}%`} 
                    icon={<span>✓</span>} 
                    trend={stats?.trends?.attendance}
                    color="green"
                    description="Overall presence rate for today"
                />
                <StatCard 
                    title="Classes" 
                    value={loading ? '...' : stats?.classes || 0} 
                    icon={<span>🏫</span>} 
                    color="orange"
                    description="Total active academic sections"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Admin Tools Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <span className="text-indigo-600 font-sans">🛠️</span> Core Admin Tools
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tools.map((tool) => (
                            <ToolCard key={tool.title} {...tool} />
                        ))}
                    </div>
                </div>

                {/* Right Side Column: Activity & Events */}
                <div className="space-y-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {!loading && stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex gap-4 relative">
                                        {i !== stats.recentActivity.length - 1 && <div className="absolute left-[13px] top-6 w-[2px] h-10 bg-slate-100" />}
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] z-10 shrink-0 border border-white">
                                            {activity.icon}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                                {activity.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {getRelativeTime(activity.date)} • System
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No recent activity detected</p>
                            )}
                        </div>
                        <button className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                            View Audit Log
                        </button>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="animate-bounce">📅</span> Upcoming
                        </h3>
                        <div className="space-y-4">
                            {!loading && stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                                stats.upcomingEvents.map(event => (
                                    <div key={event.id} className="p-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                        <p className="text-[10px] font-black uppercase text-indigo-300 font-sans">
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs font-bold mt-1 uppercase tracking-tight">{event.title}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-indigo-300 font-medium italic">No upcoming events scheduled</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
