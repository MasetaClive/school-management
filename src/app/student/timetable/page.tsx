'use client';

import { useEffect, useState } from 'react';

type TimetableEntry = {
    id: string;
    subject: { name: string; code: string };
    time_slot: { start_time: string; end_time: string; day_of_week: number };
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetablePage() {
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/student/timetable');
                const json = await res.json();
                if (res.ok) setEntries(json.data || []);
            } catch (e) {
                console.error('Failed to load timetable', e);
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    // Group entries by day
    const scheduleByDay: Record<number, TimetableEntry[]> = {};
    entries.forEach(e => {
        if (!scheduleByDay[e.time_slot.day_of_week]) {
            scheduleByDay[e.time_slot.day_of_week] = [];
        }
        scheduleByDay[e.time_slot.day_of_week].push(e);
    });

    // Sort by time
    Object.values(scheduleByDay).forEach(dayEntries => {
        dayEntries.sort((a, b) => a.time_slot.start_time.localeCompare(b.time_slot.start_time));
    });

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
                        Institutional Logistics
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        Weekly <span className="text-indigo-600">Schedule</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Synchronize your academic workflow with the master timetable
                    </p>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((dayNum) => {
                    const dayEntries = scheduleByDay[dayNum] || [];
                    return (
                        <div key={dayNum} className="space-y-4">
                            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-center italic">{DAYS[dayNum]}</h3>
                            </div>

                            <div className="space-y-3">
                                {dayEntries.length > 0 ? (
                                    dayEntries.map((entry) => (
                                        <div key={entry.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 group">
                                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1 tabular-nums">
                                                {entry.time_slot.start_time.slice(0, 5)} - {entry.time_slot.end_time.slice(0, 5)}
                                            </p>
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase italic leading-tight group-hover:text-indigo-600 transition-colors">
                                                {entry.subject.name}
                                            </h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{entry.subject.code}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No Sessions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
