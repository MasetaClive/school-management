'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type AssignedClass = {
  id: string;
  name: string;
  academic_year: string;
};

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/classes');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load classes');
        setClasses(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    }

    void loadClasses();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">My Classes</h2>
        <p className="text-xs font-medium text-slate-500">You can view the classes you teach and their student counts.</p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl shadow-slate-200/50">
          No assigned classes found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-slate-800">{cls.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cls.academic_year}</p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Open</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
