'use client';

import { FormEvent, useEffect, useState } from 'react';
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

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string; year?: string };

export default function HomeworkPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ class_id: '', subject_id: '', teacher_id: '', academic_year: '', due_after: '', due_before: '' });
    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: String(page) });
            if (search.trim()) params.set('search', search.trim());
            Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
            const res = await fetch(`/api/admin/homework?${params.toString()}`);
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
    }, [page, filters]);

    useEffect(() => {
        async function loadFilters() {
            try {
                const [classesResponse, subjectsResponse, teachersResponse, yearsResponse] = await Promise.all([
                    fetch('/api/admin/classes'), fetch('/api/admin/subjects'), fetch('/api/admin/teachers'), fetch('/api/admin/academic-years'),
                ]);
                const [classesData, subjectsData, teachersData, yearsData] = await Promise.all([
                    classesResponse.json(), subjectsResponse.json(), teachersResponse.json(), yearsResponse.json(),
                ]);
                if (classesResponse.ok) setClasses(classesData.data ?? []);
                if (subjectsResponse.ok) setSubjects(subjectsData.data ?? []);
                if (teachersResponse.ok) setTeachers(teachersData.data ?? []);
                if (yearsResponse.ok) setAcademicYears(yearsData.data ?? []);
            } catch {
                setError('Failed to load homework filters');
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

            <form onSubmit={handleSearch} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3">
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search homework, class, teacher, or subject" aria-label="Search homework" />
                <select value={filters.class_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, class_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All classes</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.grade_level ? `(${item.grade_level})` : ''}</option>)}</select>
                <select value={filters.subject_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, subject_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All subjects</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name} {item.code ? `(${item.code})` : ''}</option>)}</select>
                <select value={filters.teacher_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, teacher_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All teachers</option>{teachers.map((item) => <option key={item.id} value={item.id}>{item.full_name} {item.teacher_id ? `(${item.teacher_id})` : ''}</option>)}</select>
                <select value={filters.academic_year} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, academic_year: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All academic years</option>{academicYears.map((item) => <option key={item.id} value={item.year}>{item.year}</option>)}</select>
                <div className="flex gap-2"><input type="datetime-local" value={filters.due_after} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, due_after: event.target.value })); }} className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Due after" /><input type="datetime-local" value={filters.due_before} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, due_before: event.target.value })); }} className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Due before" /></div>
                <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium">Search</button>
            </form>

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
