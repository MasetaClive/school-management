'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AcademicYear = {
  id: string;
  year: string;
  is_active: boolean;
  is_closed: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export default function AcademicYearsPage() {
  const [data, setData] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/academic-years');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load academic years');
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load academic years');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleUpdate(id: string, payload: { is_active?: boolean; is_closed?: boolean }) {
    const action = payload.is_active ? 'activate' : 'close';
    if (!confirm(`Are you sure you want to ${action} this academic year?`)) return;

    try {
      const res = await fetch(`/api/api/admin/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Failed to ${action} year`);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${action} year`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold">Academic Years</h2>
        <Link
          href="/admin/academic-years/create"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-primary/90 transition"
        >
          Create Year
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-bold bg-red-50 p-4 rounded border border-red-200">
          {error}
        </p>
      )}

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Year</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Start Date</th>
              <th className="px-6 py-4">End Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 bg-muted/10 h-12"></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-bold text-lg">{row.year}</td>
                  <td className="px-6 py-4 space-x-2">
                    {row.is_active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase ring-1 ring-green-600/20">
                        Active
                      </span>
                    )}
                    {row.is_closed ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase ring-1 ring-red-600/20">
                        Closed/Locked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase ring-1 ring-blue-600/20">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {row.start_date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {row.end_date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {!row.is_active && !row.is_closed && (
                        <button
                          onClick={() => handleUpdate(row.id, { is_active: true })}
                          className="text-xs font-bold text-primary hover:underline px-2 py-1"
                        >
                          Set Active
                        </button>
                      )}
                      {!row.is_closed && (
                        <button
                          onClick={() => handleUpdate(row.id, { is_closed: true })}
                          className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                        >
                          Close Year
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                  No academic years found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
