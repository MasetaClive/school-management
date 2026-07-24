'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateAcademicYearPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    year: '',
    start_date: '',
    end_date: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, start_date: form.start_date || null, end_date: form.end_date || null }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create academic year');

      router.push('/admin/academic-years');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create academic year');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/academic-years"
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition"
        >
          &larr; Back to List
        </Link>
        <h2 className="text-xl font-bold">Create Academic Year</h2>
      </div>

      <div className="bg-card border rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="year" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Academic Year (e.g. 2025)
            </label>
            <input
              id="year"
              type="text"
              required
              className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition"
              placeholder="Enter year..."
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Start Date
              </label>
              <input
                id="start_date"
                type="date"
                className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                End Date
              </label>
              <input
                id="end_date"
                type="date"
                className="w-full px-4 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/20 transition"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-bold bg-red-50 p-4 rounded border border-red-200">
              {error}
            </p>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-8 py-2 rounded-md font-bold shadow hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
