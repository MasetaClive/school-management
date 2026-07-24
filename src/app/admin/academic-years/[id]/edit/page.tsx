'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditAcademicYearPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ year: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void (async () => { try { const res = await fetch(`/api/admin/academic-years/${id}`); const json = await res.json(); if (!res.ok) throw new Error(json.error || 'Failed to load academic year'); setForm({ year: json.data.year, start_date: json.data.start_date || '', end_date: json.data.end_date || '' }); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load academic year'); } finally { setLoading(false); } })(); }, [id]);

  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(null); try { const res = await fetch(`/api/admin/academic-years/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, start_date: form.start_date || null, end_date: form.end_date || null }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error || 'Failed to update academic year'); router.push('/admin/academic-years'); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update academic year'); } finally { setSaving(false); } }

  if (loading) return <p>Loading academic year...</p>;
  return <div className="max-w-2xl space-y-6"><Link href="/admin/academic-years" className="text-sm text-primary hover:underline">Back to academic years</Link><h2 className="text-xl font-bold">Edit Academic Year</h2>{error && <p className="text-sm text-red-600">{error}</p>}<form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-6"><label className="block text-sm font-medium">Year<input required pattern="[0-9]{4}" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label><div className="grid grid-cols-2 gap-4"><label className="text-sm font-medium">Start date<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label><label className="text-sm font-medium">End date<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label></div><button disabled={saving} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></form></div>;
}
