'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AcademicYear = { id: string; year: string; is_active: boolean; is_closed: boolean; start_date: string | null; end_date: string | null };
type ListResponse = { data: AcademicYear[]; page: number; total: number; totalPages: number };

export default function AcademicYearsPage() {
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/academic-years?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load academic years');
      setResult(json);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load academic years'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [page]);

  async function handleUpdate(id: string, payload: { is_active?: boolean; is_closed?: boolean }) {
    const action = payload.is_active ? 'activate' : 'close';
    if (!confirm(`Are you sure you want to ${action} this academic year?`)) return;
    try {
      const res = await fetch(`/api/admin/academic-years/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Failed to ${action} year`);
      void load();
    } catch (err) { alert(err instanceof Error ? err.message : `Failed to ${action} year`); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this academic year? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/academic-years/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete academic year');
      void load();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete academic year'); }
  }

  return <div className="space-y-6">
    <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
      <h2 className="text-xl font-bold">Academic Years</h2>
      <Link href="/admin/academic-years/create" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold">Create Year</Link>
    </div>
    <div className="flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by year" className="border rounded-md px-3 py-2 text-sm" /><button onClick={() => { if (page === 1) void load(); else setPage(1); }} className="border rounded-md px-3 py-2 text-sm">Search</button></div>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <div className="rounded-lg border bg-card overflow-hidden"><table className="w-full text-left text-sm"><thead><tr className="bg-muted/50 border-b"><th className="px-6 py-4">Year</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Start</th><th className="px-6 py-4">End</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={5} className="p-8 text-center">Loading academic years...</td></tr> : result?.data.map((row) => <tr key={row.id} className="border-t"><td className="px-6 py-4 font-bold">{row.year}</td><td className="px-6 py-4">{row.is_active ? 'Active' : row.is_closed ? 'Closed' : 'Open'}</td><td className="px-6 py-4">{row.start_date || 'Not set'}</td><td className="px-6 py-4">{row.end_date || 'Not set'}</td><td className="px-6 py-4 text-right space-x-2"><Link href={`/admin/academic-years/${row.id}/edit`} className="text-primary hover:underline">Edit</Link>{!row.is_active && !row.is_closed && <button onClick={() => void handleUpdate(row.id, { is_active: true })} className="text-primary hover:underline">Set Active</button>}{!row.is_closed && <button onClick={() => void handleUpdate(row.id, { is_closed: true })} className="text-red-600 hover:underline">Close</button>}<button onClick={() => void handleDelete(row.id)} className="text-red-600 hover:underline">Delete</button></td></tr>)}
      {!loading && result?.data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No academic years found.</td></tr>}
    </tbody></table></div>
    {result && <div className="flex justify-between text-sm"><span>Page {result.page} of {result.totalPages} (total {result.total})</span><div className="space-x-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="border rounded px-3 py-1 disabled:opacity-50">Previous</button><button disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)} className="border rounded px-3 py-1 disabled:opacity-50">Next</button></div></div>}
  </div>;
}
