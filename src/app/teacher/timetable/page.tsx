'use client';

import { useEffect, useState } from 'react';

type TimetableEntry = {
  id: string;
  academic_year: string | null;
  class: { id: string; name: string; academic_year: string | null } | null;
  subject: { id: string; name: string; code: string | null } | null;
  time_slot: { id: string; start_time: string; end_time: string; day_of_week: number | null } | null;
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/timetable');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load timetable');
        setEntries(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    }

    void loadTimetable();
  }, []);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }

  const grouped = entries.reduce<Record<number, TimetableEntry[]>>((acc, entry) => {
    const day = entry.time_slot?.day_of_week ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">My Timetable</h2>
        <p className="text-xs font-medium text-slate-500">Only your assigned lessons and classes are shown.</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl shadow-slate-200/50">
          No timetable entries are currently assigned to you.
        </div>
      ) : (
        <div className="space-y-4">
          {dayNames.map((dayName, index) => {
            const dayEntries = grouped[index] || [];
            if (dayEntries.length === 0) return null;
            return (
              <div key={dayName} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-800">{dayName}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {entry.time_slot?.start_time?.slice(0, 5)} - {entry.time_slot?.end_time?.slice(0, 5)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.academic_year || 'N/A'}</p>
                      </div>
                      <p className="text-sm font-black uppercase tracking-tight text-slate-800">{entry.subject?.name || 'Unassigned subject'}</p>
                      <p className="text-xs font-semibold text-slate-600">Class: {entry.class?.name || 'Unassigned class'}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{entry.subject?.code || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
