'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type StudentRow = {
  id: string;
  student_id: string;
  full_name: string;
  academic_year: string;
  gender: string | null;
  class?: {
    id: string;
    name: string;
    grade_level: number;
  } | null;
  parent?: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
};

type ListResponse = {
  data: StudentRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function StudentsPage() {
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load students');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this student record? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete student');
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete student');
    }
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Student Directory</h1>
          <p className="text-slate-500 font-medium">Managing the academic identity and access of all enrolled scholars.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input
              className="bg-white border border-slate-100 rounded-2xl px-6 py-3 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-sm w-64 pl-12"
              placeholder="SEARCH BY NAME OR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
          </div>
          <Link
            href="/admin/students/create"
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-100 active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Enroll Student
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">System Alert</p>
            <p className="text-xs font-bold text-rose-500">{error}</p>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Identifier</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Student Name</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Academic Level</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Guardian</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : data?.data.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      {s.student_id}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{s.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.gender || 'UNSPECIFIED'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700">{s.class ? s.class.name : 'NO CLASS ASSIGNED'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SESSION: {s.academic_year}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {s.parent ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">{s.parent.full_name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.parent.phone || 'NO CONTACT'}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase italic">PENDING LINK</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/students/${s.id}/edit`}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Edit Record"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => void handleDelete(s.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <span className="text-6xl">📁</span>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">No student records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
            Showing Page {data?.page} of {data?.totalPages} — Total Registry: {data?.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-5 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            >
              PREVIOUS
            </button>
            <button
              disabled={page >= (data?.totalPages || 1)}
              onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
              className="px-5 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
