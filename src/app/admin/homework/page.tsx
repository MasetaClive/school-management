'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type HomeworkRow = {
    id: string;
    title: string;
    due_date: string;
    class: { name: string };
    subject: { name: string; code: string };
    teacher: { full_name: string };
};

type ListResponse = {
    data: HomeworkRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function HomeworkPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/homework?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load homework');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load homework');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this homework?')) return;
        try {
            const res = await fetch(`/api/admin/homework/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to delete homework');
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete homework');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Homework Assignments</h2>
                <Link
                    href="/admin/homework/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Assign Homework
                </Link>
            </div>

            {loading && <p>Loading assignments...</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Title</th>
                                    <th className="px-3 py-2 text-left">Class</th>
                                    <th className="px-3 py-2 text-left">Subject</th>
                                    <th className="px-3 py-2 text-left">Teacher</th>
                                    <th className="px-3 py-2 text-left">Due Date</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((h) => (
                                    <tr key={h.id} className="border-t">
                                        <td className="px-3 py-2 font-medium">{h.title}</td>
                                        <td className="px-3 py-2">{h.class.name}</td>
                                        <td className="px-3 py-2">{h.subject.name} ({h.subject.code})</td>
                                        <td className="px-3 py-2">{h.teacher.full_name}</td>
                                        <td className="px-3 py-2 font-mono">
                                            {new Date(h.due_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/homework/${h.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(h.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={6}>No homework found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div>Page {data.page} of {data.totalPages}</div>
                        <div className="space-x-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
