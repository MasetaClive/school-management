'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClass() {
      try {
        const { id } = await params;
        setLoading(true);
        const res = await fetch(`/api/teacher/classes/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load class details');
        setClassData(json.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load class details');
      } finally {
        setLoading(false);
      }
    }

    void loadClass();
  }, [params]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">{classData?.name || 'Class Details'}</h2>
          <p className="text-xs font-medium text-slate-500">Academic year: {classData?.academic_year || 'N/A'}</p>
        </div>
        <Link href="/teacher/classes" className="rounded-2xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Back to Classes</Link>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <p className="text-sm font-medium text-slate-600">Grade: {classData?.grade_level || 'N/A'}</p>
        <p className="mt-4 text-sm font-medium text-slate-600">Student count: {classData?.students?.count ?? 0}</p>
      </div>
    </div>
  );
}
