'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ResultRow = {
    id: string;
    marks_obtained: number;
    grade: string | null;
    remarks: string | null;
    student: { full_name: string; student_id: string; id: string };
    exam: { name: string; exam_date: string; id: string };
};

type ListResponse = {
    data: ResultRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function ResultsPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/results?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load results');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load results');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this result?')) return;
        try {
            const res = await fetch(`/api/admin/results/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to delete result');
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete result');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Exam Results</h2>
                <div className="space-x-2">
                    <Link
                        href="/admin/results/create"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        Record Result
                    </Link>
                </div>
            </div>

            {loading && <p>Loading results...</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Student</th>
                                    <th className="px-3 py-2 text-left">Exam</th>
                                    <th className="px-3 py-2 text-left">Marks</th>
                                    <th className="px-3 py-2 text-left">Grade</th>
                                    <th className="px-3 py-2 text-left">Remarks</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((r) => (
                                    <tr key={r.id} className="border-t">
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{r.student.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{r.student.student_id}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{r.exam.name}</div>
                                            <div className="text-xs text-muted-foreground">{r.exam.exam_date}</div>
                                        </td>
                                        <td className="px-3 py-2 font-medium">{r.marks_obtained}</td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-bold">
                                                {r.grade || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">
                                            {r.remarks || '-'}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/report-cards/${r.student.id}?exam_id=${r.exam.id}`} className="text-green-600 hover:underline">Report</Link>
                                            <Link href={`/admin/results/${r.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={6}>No results found.</td>
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
