'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type ClassOption = { id: string; name: string; grade_level: number };
type ParentOption = { id: string; full_name: string; phone: string | null };

type Student = {
  id: string;
  student_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  class_id: string | null;
  parent_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  medical_info: unknown;
  admission_date: string | null;
  academic_year: string;
};

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    class_id: '',
    parent_id: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    medical_info: '',
    admission_date: '',
    academic_year: '',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [studentRes, classesRes, parentsRes] = await Promise.all([
          fetch(`/api/admin/students/${id}`),
          fetch('/api/admin/classes'),
          fetch('/api/admin/parents'),
        ]);

        const studentJson = await studentRes.json();
        const classesJson = await classesRes.json();
        const parentsJson = await parentsRes.json();

        if (!studentRes.ok) throw new Error(studentJson.error ?? 'Failed to load student');
        if (!classesRes.ok) throw new Error(classesJson.error ?? 'Failed to load classes');
        if (!parentsRes.ok) throw new Error(parentsJson.error ?? 'Failed to load parents');

        const s = studentJson as Student;
        setStudent(s);
        setClasses(classesJson.data ?? []);
        setParents(parentsJson.data ?? []);

        setForm({
          full_name: s.full_name ?? '',
          date_of_birth: s.date_of_birth ?? '',
          gender: s.gender ?? '',
          class_id: s.class_id ?? '',
          parent_id: s.parent_id ?? '',
          guardian_name: s.guardian_name ?? '',
          guardian_phone: s.guardian_phone ?? '',
          guardian_email: s.guardian_email ?? '',
          medical_info:
            s.medical_info && typeof s.medical_info === 'object'
              ? JSON.stringify(s.medical_info, null, 2)
              : '',
          admission_date: s.admission_date ?? '',
          academic_year: s.academic_year ?? '',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load student');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        full_name: form.full_name || undefined,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        class_id: form.class_id || undefined,
        parent_id: form.parent_id || undefined,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        guardian_email: form.guardian_email,
        medical_info: form.medical_info ? JSON.parse(form.medical_info) : {},
        admission_date: form.admission_date || undefined,
        academic_year: form.academic_year || undefined,
      };

      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update student');

      router.push('/admin/students');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update student');
    } finally {
      setSaving(false);
    }
  }

  const inputClasses = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-sm focus:bg-white";
  const labelClasses = "text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block ml-1";

  if (loading) return <div className="p-20 text-center text-xs font-black uppercase tracking-widest text-slate-400 italic">Synchronizing Academic Records...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/students" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline italic">← Return to Directory</Link>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Update Record</h1>
          <p className="text-slate-500 font-medium font-sans">Modify academic and identity metadata for <span className="text-indigo-600 font-black">{student?.student_id}</span>.</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Protocol Failure</p>
            <p className="text-xs font-bold text-rose-500">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Identity Section */}
        <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100 text-white">🆔</div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Primary Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Legal Full Name *</label>
              <input
                required
                className={inputClasses}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Student ID (Read Only)</label>
              <div className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black text-slate-400 italic">
                {student?.student_id}
              </div>
            </div>
            <div>
              <label className={labelClasses}>Date of Birth</label>
              <input
                type="date"
                className={inputClasses}
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Gender Recognition</label>
              <select 
                className={inputClasses + " appearance-none"}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Academic & Placement */}
        <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100 text-white">🏫</div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Academic Placement</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className={labelClasses}>Academic Year *</label>
              <input
                required
                className={inputClasses}
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Current Class</label>
              <select 
                className={inputClasses + " appearance-none"}
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Admission Date</label>
              <input
                type="date"
                className={inputClasses}
                value={form.admission_date}
                onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 3. Guardianship Link */}
        <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-amber-100 text-white">👪</div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Family Linking</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Linked Parent Record</label>
              <select 
                className={inputClasses + " appearance-none"}
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              >
                <option value="">No parent linked</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} {p.phone ? `(${p.phone})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className={labelClasses}>Manual Guardian Override</label>
              <input
                placeholder="Guardian Name"
                className={inputClasses}
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Guardian Phone</label>
              <input
                type="tel"
                className={inputClasses}
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Guardian Email</label>
              <input
                type="email"
                className={inputClasses}
                value={form.guardian_email}
                onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-8">
            <label className={labelClasses}>Medical Information</label>
            <textarea
              rows={4}
              className={inputClasses}
              value={form.medical_info}
              onChange={(e) => setForm({ ...form, medical_info: e.target.value })}
            />
          </div>
        </div>

        {/* Submit Area */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Permanent log of all metadata mutations will be archived.</p>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-12 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-100 disabled:opacity-50 active:scale-95"
            >
              {saving ? 'Synchronizing...' : 'Commit Protocol Update'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
