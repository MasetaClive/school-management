'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NoticeBoard from '@/components/dashboard/NoticeBoard';

type DashboardData = {
    profile: any;
    stats: {
        attendanceRate: number;
        pendingHomework: number;
        gpa: null;
        credits: null;
    };
    recentResults: any[];
    todaySchedule: any[];
};

export default function StudentDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/student/dashboard');
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (e) {
                console.error('Failed to load dashboard', e);
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Synchronizing Portal...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'GPA', value: data?.stats.gpa ?? 'Not available', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Attendance', value: `${data?.stats.attendanceRate}%`, icon: '📅', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Homework', value: `${data?.stats.pendingHomework} Active`, icon: '📝', color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Credits', value: data?.stats.credits ?? 'Not available', icon: '⭐', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const quickLinks = [
        { title: 'My Classes', desc: 'Timetable & Subjects', href: '/student/classes', icon: '📚', theme: 'indigo' },
        { title: 'Homework', desc: 'Assignments & Due Dates', href: '/student/homework', icon: '✍️', theme: 'rose' },
        { title: 'Results', desc: 'Exams & Report Cards', href: '/student/results', icon: '📊', theme: 'emerald' },
        { title: 'Library', desc: 'Browse Book Catalog', href: '/student/library', icon: '📖', theme: 'amber' },
        { title: 'Messages', desc: 'Internal School Comms', href: '/messages', icon: '✉️', theme: 'blue' },
        { title: 'Settings', desc: 'Account Preferences', href: '/student/settings', icon: '⚙️', theme: 'slate' },
    ];

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/20 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-rose-500/10 rounded-full blur-[100px] -ml-40 -mb-40" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Academic Profile Active
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">
                            Hello,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">
                                {data?.profile?.full_name?.split(' ')[0] || 'Scholar'}
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            <span>ID: {data?.profile?.student_id}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span>Grade: {data?.profile?.class?.grade_level}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span>{data?.profile?.class?.name}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                            <p className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mt-2">
                                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Metric</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${stat.color} mt-1`}>{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Navigation Matrix */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em]">Knowledge Matrix</h3>
                            <div className="h-px flex-1 bg-slate-100 mx-6" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {quickLinks.map((link) => (
                                <Link 
                                    key={link.title}
                                    href={link.href}
                                    className="group relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500"
                                >
                                    <div className="relative z-10 flex items-center gap-5">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                                            {link.icon}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">{link.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{link.desc}</p>
                                        </div>
                                    </div>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-indigo-600 text-xl">
                                        →
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Synchronized Schedule</h3>
                            <Link href="/student/timetable" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4">Full Timetable</Link>
                        </div>
                        <div className="space-y-4">
                            {data?.todaySchedule && data.todaySchedule.length > 0 ? (
                                data.todaySchedule.map((entry: any, i: number) => (
                                    <div key={i} className="flex items-center gap-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                                        <div className="text-[10px] font-black text-slate-400 w-24 tabular-nums uppercase tracking-widest">
                                            {entry.time_slot.start_time.slice(0, 5)} - {entry.time_slot.end_time.slice(0, 5)}
                                        </div>
                                        <div className="h-10 w-px bg-slate-200" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{entry.subject.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.subject.code}</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">
                                            Scheduled
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No classes scheduled for today</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Performance */}
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Academic Velocity</h3>
                            <Link href="/student/results" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4">Detailed Reports</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data?.recentResults && data.recentResults.length > 0 ? (
                                data.recentResults.map((res: any, i: number) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">{res.exam.subject.name}</p>
                                            <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{res.exam.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 tracking-tighter">{res.marks_obtained}/{res.exam.max_marks}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Final Mark</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    No recent exam results published
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-10">
                    <NoticeBoard />

                    {/* Quick Support Card */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-2xl mx-auto shadow-lg shadow-indigo-100">
                            🛡️
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-indigo-900 uppercase italic tracking-tight">Need Assistance?</h3>
                            <p className="text-[10px] font-bold text-indigo-600/60 uppercase leading-relaxed tracking-widest px-4">
                                Reach out to academic support or access the knowledge base.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
