'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Homework = {
    id: string;
    title: string;
    due_date: string;
    class: { name: string };
    subject: { name: string; code: string };
};

export default function TeacherHomeworkPage() {
    const [data, setData] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/homework'); // Reuse admin API which has role checks
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to load homework');
            setData(json.data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load homework');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            const res = await fetch(`/api/admin/homework/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to delete');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Homework Management</h2>
                <Link
                    href="/teacher/homework/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Create Assignment
                </Link>
            </div>

            {loading && <p>Loading assignments...</p>}
            {error && <p className="text-red-500 font-medium">{error}</p>}

            {!loading && (
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="min-w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider font-bold">Title</th>
                                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider font-bold">Class</th>
                                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider font-bold">Subject</th>
                                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider font-bold">Due Date</th>
                                <th className="px-4 py-2 text-right text-xs uppercase tracking-wider font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((h) => (
                                <tr key={h.id} className="border-t hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-2 font-medium">{h.title}</td>
                                    <td className="px-4 py-2">{h.class.name}</td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold mr-2">{h.subject.code}</span>
                                        {h.subject.name}
                                    </td>
                                    <td className="px-4 py-2 text-muted-foreground">{new Date(h.due_date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-right space-x-3">
                                        <Link href={`/teacher/homework/${h.id}/edit`} className="text-primary hover:underline font-medium">Edit</Link>
                                        <button onClick={() => void handleDelete(h.id)} className="text-red-600 hover:underline font-medium">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No homework assignments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
