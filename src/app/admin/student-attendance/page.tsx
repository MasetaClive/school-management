'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

type AttendanceRow = {
    id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'late';
    remarks: string | null;
    student: { full_name: string; student_id: string };
    class: { name: string };
};

type ListResponse = {
    data: AttendanceRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

type SelectOption = { id: string; name?: string; full_name?: string; student_id?: string; grade_level?: string };

export default function StudentAttendancePage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ student_id: '', class_id: '', date: '', status: '' });
    const [students, setStudents] = useState<SelectOption[]>([]);
    const [classes, setClasses] = useState<SelectOption[]>([]);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: String(page) });
            if (search.trim()) params.set('search', search.trim());
            Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
            const res = await fetch(`/api/admin/student-attendance?${params.toString()}`);
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
    }, [page, filters]);

    useEffect(() => {
        async function loadFilters() {
            try {
                const [studentsResponse, classesResponse] = await Promise.all([
                    fetch('/api/admin/students'), fetch('/api/admin/classes'),
                ]);
                const [studentsData, classesData] = await Promise.all([
                    studentsResponse.json(), classesResponse.json(),
                ]);
                if (studentsResponse.ok) setStudents(studentsData.data ?? []);
                if (classesResponse.ok) setClasses(classesData.data ?? []);
            } catch {
                setError('Failed to load attendance filters');
            }
        }
        void loadFilters();
    }, []);

    function handleSearch(event: FormEvent) {
        event.preventDefault();
        if (page === 1) void load();
        else setPage(1);
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const res = await fetch(`/api/admin/student-attendance/${id}`, { method: 'DELETE' });
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
                <h2 className="text-2xl font-bold">Student Attendance</h2>
                <Link
                    href="/admin/student-attendance/create"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Record Attendance
                </Link>
            </div>

            <form onSubmit={handleSearch} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3">
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search student or class" aria-label="Search attendance" />
                <select value={filters.student_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, student_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All students</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name} {student.student_id ? `(${student.student_id})` : ''}</option>)}</select>
                <select value={filters.class_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, class_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All classes</option>{classes.map((classOption) => <option key={classOption.id} value={classOption.id}>{classOption.name} {classOption.grade_level ? `(${classOption.grade_level})` : ''}</option>)}</select>
                <input type="date" value={filters.date} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, date: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm" aria-label="Filter by date" />
                <select value={filters.status} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, status: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All statuses</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option></select>
                <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium">Search</button>
            </form>

            {loading && <p>Loading history...</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Student</th>
                                    <th className="px-3 py-2 text-left">Class</th>
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
                                            {r.student.full_name} ({r.student.student_id})
                                        </td>
                                        <td className="px-3 py-2">{r.class.name}</td>
                                        <td className="px-3 py-2 capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    r.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">
                                            {r.remarks || '-'}
                                        </td>
                                        <td className="px-3 py-2 space-x-2">
                                            <Link href={`/admin/student-attendance/${r.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                            <button onClick={() => void handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={6}>No records found.</td>
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
