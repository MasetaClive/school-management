'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AttendanceRow = {
    id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'late';
    remarks: string | null;
    teacher: { full_name: string; teacher_id: string };
};

type ListResponse = {
    data: AttendanceRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function TeacherAttendancePage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/teacher-attendance?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load attendance');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load attendance');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const res = await fetch(`/api/admin/teacher-attendance/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to delete record');
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete record');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Teacher Attendance</h2>
                <Link
                    href="/admin/teacher-attendance/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Record Attendance
                </Link>
            </div>

            {loading && <p>Loading history...</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Teacher</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Remarks</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((r) => (
                                    <tr key={r.id} className="border-t">
                                        <td className="px-3 py-2 font-mono">{r.attendance_date}</td>
                                        <td className="px-3 py-2 font-medium">
                                            {r.teacher.full_name} ({r.teacher.teacher_id})
                                        </td>
                                        <td className="px-3 py-2 capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    r.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                                            {r.remarks || '-'}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/teacher-attendance/${r.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={5}>No records found.</td>
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
