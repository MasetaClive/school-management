'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TimeSlotRow = {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
};

type ListResponse = {
    data: TimeSlotRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export default function TimeSlotsPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/time-slots?page=${page}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to load time slots');
            }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load time slots');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this time slot?')) return;
        try {
            const res = await fetch(`/api/admin/time-slots/${id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to delete time slot');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete time slot');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Time Slots</h2>
                <Link
                    href="/admin/time-slots/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Add Slot
                </Link>
            </div>

            {loading && <p>Loading time slots...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Day</th>
                                    <th className="px-3 py-2 text-left">Start Time</th>
                                    <th className="px-3 py-2 text-left">End Time</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((s) => (
                                    <tr key={s.id} className="border-t">
                                        <td className="px-3 py-2 font-medium">{DAYS[s.day_of_week]}</td>
                                        <td className="px-3 py-2 font-mono">
                                            {s.start_time.slice(0, 5)}
                                        </td>
                                        <td className="px-3 py-2 font-mono">
                                            {s.end_time.slice(0, 5)}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link
                                                href={`/admin/time-slots/${s.id}/edit`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => void handleDelete(s.id)}
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
                                            colSpan={4}
                                        >
                                            No time slots found.
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
