'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Exam = {
  id: string;
  name: string;
  exam_date: string;
  max_marks: number;
  academic_year: string;
  class: { name: string } | null;
  subject: { name: string; code: string } | null;
};

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadExams() {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/exams');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load exams');
      setExams(json.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">My Exams</h2>
          <p className="text-xs font-medium text-slate-500">Only exams you created are shown.</p>
        </div>
        <Link href="/teacher/exams/create" className="rounded-[2rem] bg-indigo-600 px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white">Create Exam</Link>
      </div>
      {exams.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl shadow-slate-200/50">No exams found.</div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-slate-800">{exam.name}</p>
                  <p className="text-xs font-semibold text-slate-600">{exam.subject?.name || 'Subject'} • {exam.class?.name || 'Class'}</p>
                </div>
                <div className="text-right text-xs font-semibold text-slate-500">
                  <p>{new Date(exam.exam_date).toLocaleDateString()}</p>
                  <p>Max marks: {exam.max_marks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
