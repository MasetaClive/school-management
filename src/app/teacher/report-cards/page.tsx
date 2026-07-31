'use client';

import { useEffect, useState } from 'react';

type ReportCardData = {
  student: { name: string; student_id: string; class: string };
  exam: { name: string; date: string; academic_year: string };
  subjects: Array<{ subject: string; code: string; marks: number; maxMarks: number; percentage: number; grade: string; remarks?: string | null }>;
  summary: { totalObtained: number; totalMax: number; overallPercentage: number; overallGrade: string; passed: boolean | null; resultCount: number; isComplete: boolean };
};

export default function TeacherReportCardsPage() {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/report-cards?student_id=00000000-0000-0000-0000-000000000000&exam_id=00000000-0000-0000-0000-000000000000');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load report card');
        setData(json.data || null);
      } catch (e: any) {
        setError(e.message || 'Failed to load report card');
      } finally {
        setLoading(false);
      }
    }

    void loadReport();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;

  if (!data) return <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl shadow-slate-200/50">No report card data available.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Report Cards</h2>
        <p className="mt-2 text-sm text-slate-600">Generated from exam results for the selected student and exam.</p>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <p className="text-sm font-black uppercase tracking-tight text-slate-800">{data.student.name}</p>
        <p className="text-xs font-semibold text-slate-500">{data.student.class} • {data.exam.name}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.subjects.map((entry) => (
            <div key={`${entry.subject}-${entry.code}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-tight text-slate-800">{entry.subject}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{entry.grade}</p>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">{entry.marks}/{entry.maxMarks} • {entry.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
