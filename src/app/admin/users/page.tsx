'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  created_at: string;
  student?: { full_name: string; student_id: string };
  parent?: { full_name: string; parent_id: string };
  teacher?: { full_name: string; teacher_id: string };
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?page=${page}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load users');
      setData(json.data);
      setTotalPages(json.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user? This will also unlink any student/parent/teacher records.')) return;
    try {
      const res = await fetch(`/api/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to delete user');
      }
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete user');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold">User Management</h2>
        <Link
          href="/admin/users/create"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-primary/90 transition"
        >
          Create User
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
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Linked To</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 bg-muted/10 h-12"></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{user.email}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{user.full_name || 'No Name'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-[10px] font-bold uppercase ring-1 ring-border">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.student ? (
                      <div className="text-xs">
                        <span className="font-semibold">Student:</span> {user.student.full_name} ({user.student.student_id})
                      </div>
                    ) : user.parent ? (
                      <div className="text-xs">
                        <span className="font-semibold">Parent:</span> {user.parent.full_name} ({user.parent.parent_id})
                      </div>
                    ) : user.teacher ? (
                      <div className="text-xs">
                        <span className="font-semibold">Teacher:</span> {user.teacher.full_name} ({user.teacher.teacher_id})
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic tracking-tight">Not Linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-[10px]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-30 text-xs font-bold transition hover:bg-muted"
          >
            Previous
          </button>
          <span className="text-xs font-bold">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-30 text-xs font-bold transition hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
