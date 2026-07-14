'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ExamRow = {
    id: string;
    name: string;
    exam_date: string;
    max_marks: number;
    academic_year: string;
    class: { name: string; grade_level: number };
    subject: { name: string; code: string };
};

type ListResponse = {
    data: ExamRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function ExamsPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/exams?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load exams');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load exams');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        try {
            const res = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to delete exam');
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete exam');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Exams Management</h2>
                <Link
                    href="/admin/exams/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Create Exam
                </Link>
            </div>

            {loading && <p>Loading exams...</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Exam Name</th>
                                    <th className="px-3 py-2 text-left">Class</th>
                                    <th className="px-3 py-2 text-left">Subject</th>
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Max Marks</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((exam) => (
                                    <tr key={exam.id} className="border-t">
                                        <td className="px-3 py-2 font-medium">{exam.name}</td>
                                        <td className="px-3 py-2">{exam.class.name}</td>
                                        <td className="px-3 py-2">{exam.subject.name} ({exam.subject.code})</td>
                                        <td className="px-3 py-2 font-mono">{exam.exam_date}</td>
                                        <td className="px-3 py-2">{exam.max_marks}</td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/exams/${exam.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(exam.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={6}>No exams found.</td>
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
