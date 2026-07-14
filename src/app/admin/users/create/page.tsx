'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Entity = { id: string; full_name: string; [key: string]: string };

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingEntities, setFetchingEntities] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entities, setEntities] = useState<{
    students: Entity[];
    parents: Entity[];
    teachers: Entity[];
  }>({ students: [], parents: [], teachers: [] });

  const [form, setForm] = useState({
    email: '',
    role: 'student',
    full_name: '',
    student_id: '',
    parent_id: '',
    teacher_id: '',
  });

  async function loadEntities() {
    try {
      setFetchingEntities(true);
      const res = await fetch('/api/admin/users/entities');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load entities');
      setEntities(json);
    } catch (e) {
      console.error(e);
      setError('Could not load unlinked students/teachers/parents');
    } finally {
      setFetchingEntities(false);
    }
  }

  useEffect(() => {
    void loadEntities();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Clean IDs based on role
      const payload = {
        email: form.email,
        role: form.role,
        full_name: form.full_name,
        student_id: form.role === 'student' ? form.student_id : null,
        parent_id: form.role === 'parent' ? form.parent_id : null,
        teacher_id: form.role === 'teacher' ? form.teacher_id : null,
      };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create user');

      router.push('/admin/users');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/users"
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition"
        >
          &larr; Back to List
        </Link>
        <h2 className="text-xl font-bold">Create User Account</h2>
      </div>

      <div className="bg-card border rounded-lg shadow-sm p-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Full Name (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition"
              placeholder="Display Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Account Role
            </label>
            <select
              className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition appearance-none"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, student_id: '', parent_id: '', teacher_id: '' })}
            >
              <option value="admin">Administrator</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Link to Student
              </label>
              <select
                className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition appearance-none"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              >
                <option value="">-- No Student Selected --</option>
                {entities.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.role === 'teacher' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Link to Teacher
              </label>
              <select
                className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition appearance-none"
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              >
                <option value="">-- No Teacher Selected --</option>
                {entities.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.teacher_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.role === 'parent' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Link to Parent
              </label>
              <select
                className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition appearance-none"
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              >
                <option value="">-- No Parent Selected --</option>
                {entities.parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.parent_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 font-bold bg-red-50 p-4 rounded border border-red-200">
              {error}
            </p>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || (fetchingEntities && form.role !== 'admin')}
              className="bg-primary text-primary-foreground px-8 py-2 rounded-md font-bold shadow hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
