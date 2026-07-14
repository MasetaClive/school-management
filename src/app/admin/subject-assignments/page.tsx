'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AssignmentRow = {
    id: string;
    teacher: { full_name: string; teacher_id: string };
    subject: { name: string; code: string };
    class: { name: string; grade_level: string };
    academic_year: string;
    created_at: string;
};

type ListResponse = {
    data: AssignmentRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function SubjectAssignmentsPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/subject-assignments?page=${page}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to load assignments');
            }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            const res = await fetch(`/api/admin/subject-assignments/${id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to delete assignment');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete assignment');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Subject Assignments</h2>
                <Link
                    href="/admin/subject-assignments/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    New Assignment
                </Link>
            </div>

            {loading && <p>Loading assignments...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Teacher</th>
                                    <th className="px-3 py-2 text-left">Subject</th>
                                    <th className="px-3 py-2 text-left">Class</th>
                                    <th className="px-3 py-2 text-left">Year</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((a) => (
                                    <tr key={a.id} className="border-t">
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{a.teacher.full_name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{a.teacher.teacher_id}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{a.subject.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{a.subject.code}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{a.class.name}</div>
                                            <div className="text-xs text-muted-foreground">{a.class.grade_level}</div>
                                        </td>
                                        <td className="px-3 py-2 font-mono">{a.academic_year}</td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link
                                                href={`/admin/subject-assignments/${a.id}/edit`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => void handleDelete(a.id)}
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
                                            colSpan={5}
                                        >
                                            No assignments found.
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
