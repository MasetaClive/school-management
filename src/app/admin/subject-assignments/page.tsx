'use client';

import { FormEvent, useEffect, useState } from 'react';
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

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string };

export default function SubjectAssignmentsPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ teacher_id: '', subject_id: '', class_id: '' });
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [classes, setClasses] = useState<SelectOption[]>([]);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: String(page) });
            if (search.trim()) params.set('search', search.trim());
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });
            const res = await fetch(`/api/admin/subject-assignments?${params.toString()}`);
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
    }, [page, filters]);

    useEffect(() => {
        async function loadFilters() {
            const [teachersResponse, subjectsResponse, classesResponse] = await Promise.all([
                fetch('/api/admin/teachers'),
                fetch('/api/admin/subjects'),
                fetch('/api/admin/classes'),
            ]);
            const [teacherData, subjectData, classData] = await Promise.all([
                teachersResponse.json(), subjectsResponse.json(), classesResponse.json(),
            ]);
            if (teachersResponse.ok) setTeachers(teacherData.data ?? []);
            if (subjectsResponse.ok) setSubjects(subjectData.data ?? []);
            if (classesResponse.ok) setClasses(classData.data ?? []);
        }
        void loadFilters();
    }, []);

    function handleSearch(event: FormEvent) {
        event.preventDefault();
        if (page === 1) {
            void load();
        } else {
            setPage(1);
        }
    }

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

            <form onSubmit={handleSearch} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Search teacher, subject, class, or year"
                    aria-label="Search assignments"
                />
                <select value={filters.teacher_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, teacher_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">All teachers</option>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name} ({teacher.teacher_id})</option>)}
                </select>
                <select value={filters.subject_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, subject_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">All subjects</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
                </select>
                <select value={filters.class_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, class_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">All classes</option>
                    {classes.map((classOption) => <option key={classOption.id} value={classOption.id}>{classOption.name} ({classOption.grade_level})</option>)}
                </select>
                <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium">Search</button>
            </form>

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
