'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NoticeBoard from '@/components/dashboard/NoticeBoard';

type Stats = {
    classCount: number;
    homeworkCount: number;
    schedule: Array<{
        id: string;
        class: { name: string };
        subject: { name: string; code: string };
        time_slot: { start_time: string; end_time: string };
    }>;
};

export default function TeacherDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/teacher/dashboard/stats');
                const json = await res.json();
                setStats(json);
            } catch (e) {
                console.error('Failed to load stats');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h2>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">My Classes</p>
                    <p className="text-3xl font-black">{loading ? '...' : stats?.classCount}</p>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Homework</p>
                    <p className="text-3xl font-black">{loading ? '...' : stats?.homeworkCount}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Schedule Widget */}
                <div className="col-span-1 lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="bg-muted/50 px-6 py-4 border-b">
                        <h3 className="font-bold">Today&apos;s Schedule</h3>
                    </div>
                    <div className="p-6">
                        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading schedule...</p>}
                        {!loading && stats?.schedule.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No classes scheduled for today.</p>
                        )}
                        {!loading && stats?.schedule && stats.schedule.length > 0 && (
                            <div className="space-y-4">
                                {stats.schedule.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 text-primary p-2 rounded-md font-mono text-xs font-bold">
                                                {entry.time_slot.start_time.slice(0, 5)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{entry.subject.name}</p>
                                                <p className="text-xs text-muted-foreground">{entry.class.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            {entry.time_slot.end_time.slice(0, 5)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Link
                        href="/teacher/homework"
                        className="block rounded-xl border bg-card p-6 shadow-sm transition hover:border-primary group"
                    >
                        <h3 className="font-bold group-hover:text-primary transition-colors">Homework Management</h3>
                        <p className="text-sm text-muted-foreground">Assign and track student homework</p>
                    </Link>
                    <Link
                        href="/admin/student-attendance"
                        className="block rounded-xl border bg-card p-6 shadow-sm transition hover:border-primary group"
                    >
                        <h3 className="font-bold group-hover:text-primary transition-colors">Attendance</h3>
                        <p className="text-sm text-muted-foreground">Record daily student attendance</p>
                    </Link>
                    <Link
                        href="/messages"
                        className="block rounded-xl border bg-card p-6 shadow-sm transition hover:border-primary group"
                    >
                        <h3 className="font-bold text-blue-600 group-hover:text-blue-700 transition-colors">Messages</h3>
                        <p className="text-sm text-muted-foreground">Internal school messaging system</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
