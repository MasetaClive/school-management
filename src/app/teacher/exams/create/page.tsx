'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ClassOption = { id: string; name: string; academic_year: string };
type SubjectOption = { id: string; name: string; code: string };

export default function CreateTeacherExamPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    class_id: '',
    subject_id: '',
    exam_type: 'assessment',
    exam_date: '',
    max_marks: 100,
    academic_year: '',
  });

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/teacher/classes');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load classes');
        const list = json.data || [];
        setClasses(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, class_id: list[0].id, academic_year: list[0].academic_year }));
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    }
    void loadClasses();
  }, []);

  useEffect(() => {
    if (!form.class_id) {
      setSubjects([]);
      return;
    }
    async function loadSubjects() {
      try {
        const res = await fetch(`/api/teacher/subjects?class_id=${form.class_id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load subjects');
        const list = json.data || [];
        setSubjects(list);
        if (list.length > 0) setForm((prev) => ({ ...prev, subject_id: list[0].id }));
        else setForm((prev) => ({ ...prev, subject_id: '' }));
      } catch (e: any) {
        setError(e.message || 'Failed to load subjects');
      }
    }
    void loadSubjects();
  }, [form.class_id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, max_marks: Number(form.max_marks) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create exam');
      router.push('/teacher/exams');
    } catch (e: any) {
      setError(e.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
      <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Create Exam</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="Exam name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="w-full rounded-2xl border border-slate-200 p-3 text-sm" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value, academic_year: classes.find((c) => c.id === e.target.value)?.academic_year || '' })} required>
          {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
        </select>
        <select className="w-full rounded-2xl border border-slate-200 p-3 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <input type="date" className="w-full rounded-2xl border border-slate-200 p-3 text-sm" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} required />
        <input type="number" min="1" max="1000" className="w-full rounded-2xl border border-slate-200 p-3 text-sm" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })} required />
        <select className="w-full rounded-2xl border border-slate-200 p-3 text-sm" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })}>
          <option value="assessment">Assessment</option>
          <option value="quiz">Quiz</option>
          <option value="test">Test</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="practical">Practical</option>
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-[2rem] bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create Exam'}</button>
      </form>
    </div>
  );
}
