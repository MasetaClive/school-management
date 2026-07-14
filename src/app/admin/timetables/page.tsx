'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TimetableRow = {
    id: string;
    class: { name: string; grade_level: number };
    subject: { name: string; code: string };
    teacher: { full_name: string; teacher_id: string };
    time_slot: { day_of_week: number; start_time: string; end_time: string };
    academic_year: string;
};

type ListResponse = {
    data: TimetableRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablesPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/timetables?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load timetables');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load timetables');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this timetable entry?')) return;
        try {
            const res = await fetch(`/api/admin/timetables/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to delete entry');
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete entry');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Timetables</h2>
                <Link
                    href="/admin/timetables/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Add Entry
                </Link>
            </div>

            {loading && <p>Loading timetable schedule...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Class</th>
                                    <th className="px-3 py-2 text-left">Subject</th>
                                    <th className="px-3 py-2 text-left">Teacher</th>
                                    <th className="px-3 py-2 text-left">Time Slot</th>
                                    <th className="px-3 py-2 text-left">Year</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((t) => (
                                    <tr key={t.id} className="border-t">
                                        <td className="px-3 py-2 font-medium">{t.class.name}</td>
                                        <td className="px-3 py-2">{t.subject.name} ({t.subject.code})</td>
                                        <td className="px-3 py-2">{t.teacher.full_name}</td>
                                        <td className="px-3 py-2">
                                            {DAYS[t.time_slot.day_of_week]}: {t.time_slot.start_time.slice(0, 5)} - {t.time_slot.end_time.slice(0, 5)}
                                        </td>
                                        <td className="px-3 py-2">{t.academic_year}</td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/timetables/${t.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(t.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
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
