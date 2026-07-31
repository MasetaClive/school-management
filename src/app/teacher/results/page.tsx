'use client';

import { useEffect, useState } from 'react';

type ResultEntry = {
  id: string;
  marks_obtained: number;
  grade: string;
  student: { full_name: string; student_id: string } | null;
  exam: { name: string; exam_date: string } | null;
};

export default function TeacherResultsPage() {
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/results');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load results');
        setResults(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    void loadResults();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Results</h2>
        <p className="text-xs font-medium text-slate-500">Grades and marks for exams you own are shown here.</p>
      </div>
      {results.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl shadow-slate-200/50">No results recorded yet.</div>
      ) : (
        <div className="grid gap-4">
          {results.map((result) => (
            <div key={result.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-slate-800">{result.student?.full_name || 'Student'}</p>
                  <p className="text-xs font-semibold text-slate-600">{result.exam?.name || 'Exam'} • {result.student?.student_id}</p>
                </div>
                <div className="text-right text-xs font-semibold text-slate-500">
                  <p>Marks: {result.marks_obtained}</p>
                  <p>Grade: {result.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
