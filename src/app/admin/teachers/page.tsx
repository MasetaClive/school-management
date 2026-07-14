'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TeacherRow = {
    id: string;
    teacher_id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    hire_date: string | null;
    created_at: string;
};

type ListResponse = {
    data: TeacherRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function TeachersPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.set('page', String(page));
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/teachers?${params.toString()}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to load teachers');
            }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load teachers');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this teacher?')) return;
        try {
            const res = await fetch(`/api/admin/teachers/${id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to delete teacher');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete teacher');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Teachers</h2>
                <Link
                    href="/admin/teachers/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Add Teacher
                </Link>
            </div>

            <div className="flex gap-2 items-center">
                <input
                    className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Search by name or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    onClick={() => {
                        setPage(1);
                        void load();
                    }}
                    className="px-3 py-2 rounded-md border text-sm"
                >
                    Search
                </button>
            </div>

            {loading && <p>Loading teachers...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Teacher ID</th>
                                    <th className="px-3 py-2 text-left">Full Name</th>
                                    <th className="px-3 py-2 text-left">Phone</th>
                                    <th className="px-3 py-2 text-left">Email</th>
                                    <th className="px-3 py-2 text-left">Hire Date</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((t) => (
                                    <tr key={t.id} className="border-t">
                                        <td className="px-3 py-2 font-mono">{t.teacher_id}</td>
                                        <td className="px-3 py-2 font-medium">{t.full_name}</td>
                                        <td className="px-3 py-2">{t.phone ?? '—'}</td>
                                        <td className="px-3 py-2">{t.email ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            {t.hire_date ? new Date(t.hire_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link
                                                href={`/admin/teachers/${t.id}/edit`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => void handleDelete(t.id)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td
                                            className="px-3 py-4 text-center text-muted-foreground"
                                            colSpan={6}
                                        >
                                            No teachers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div>
                            Page {data.page} of {data.totalPages} (total {data.total})
                        </div>
                        <div className="space-x-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page >= data.totalPages}
                                onClick={() =>
                                    setPage((p) =>
                                        data.totalPages ? Math.min(data.totalPages, p + 1) : p,
                                    )
                                }
                                className="px-3 py-1 rounded border disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
