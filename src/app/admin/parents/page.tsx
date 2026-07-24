'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ParentRow = {
    id: string;
    parent_id: string;
    full_name: string;
    phone: string;
    email: string | null;
    created_at: string;
};

type ListResponse = {
    data: ParentRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function ParentsPage() {
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

            const res = await fetch(`/api/admin/parents?${params.toString()}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to load parents');
            }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load parents');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this parent?')) return;
        try {
            const res = await fetch(`/api/admin/parents/${id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to delete parent');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete parent');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Parents</h2>
                <Link
                    href="/admin/parents/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Add Parent
                </Link>
            </div>

            <div className="flex gap-2 items-center">
                <input
                    className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Search by name, ID, email, or phone"
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

            {loading && <p>Loading parents...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Parent ID</th>
                                    <th className="px-3 py-2 text-left">Full Name</th>
                                    <th className="px-3 py-2 text-left">Phone</th>
                                    <th className="px-3 py-2 text-left">Email</th>
                                    <th className="px-3 py-2 text-left">Created At</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((p) => (
                                    <tr key={p.id} className="border-t">
                                        <td className="px-3 py-2">{p.parent_id}</td>
                                        <td className="px-3 py-2">{p.full_name}</td>
                                        <td className="px-3 py-2">{p.phone}</td>
                                        <td className="px-3 py-2">{p.email ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link
                                                href={`/admin/parents/${p.id}/edit`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => void handleDelete(p.id)}
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
                                            No parents found.
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
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page >= data.totalPages}
                                onClick={() =>
                                    setPage((prev) =>
                                        data.totalPages ? Math.min(data.totalPages, prev + 1) : prev,
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
