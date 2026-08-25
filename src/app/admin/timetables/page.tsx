'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
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

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string; year?: string };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablesPage() {
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ academic_year: '', class_id: '', teacher_id: '', subject_id: '', day_of_week: '' });
    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: String(page) });
            if (search.trim()) params.set('search', search.trim());
            Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
            const res = await fetch(`/api/admin/timetables?${params.toString()}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load timetables');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load timetables');
        } finally {
            setLoading(false);
        }
    }, [page, search, filters]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        async function loadFilters() {
            try {
                const [classesResponse, teachersResponse, subjectsResponse, yearsResponse] = await Promise.all([
                    fetch('/api/admin/classes'), fetch('/api/admin/teachers'), fetch('/api/admin/subjects'), fetch('/api/admin/academic-years'),
                ]);
                const [classesData, teachersData, subjectsData, yearsData] = await Promise.all([
                    classesResponse.json(), teachersResponse.json(), subjectsResponse.json(), yearsResponse.json(),
                ]);
                if (classesResponse.ok) setClasses(classesData.data ?? []);
                if (teachersResponse.ok) setTeachers(teachersData.data ?? []);
                if (subjectsResponse.ok) setSubjects(subjectsData.data ?? []);
                if (yearsResponse.ok) setAcademicYears(yearsData.data ?? []);
            } catch {
                setError('Failed to load timetable filters');
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

            <form onSubmit={handleSearch} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3">
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search class, teacher, subject, or year" aria-label="Search timetables" />
                <select value={filters.academic_year} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, academic_year: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All academic years</option>{academicYears.map((year) => <option key={year.id} value={year.year}>{year.year}</option>)}</select>
                <select value={filters.class_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, class_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All classes</option>{classes.map((classOption) => <option key={classOption.id} value={classOption.id}>{classOption.name} {classOption.grade_level ? `(${classOption.grade_level})` : ''}</option>)}</select>
                <select value={filters.teacher_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, teacher_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name} {teacher.teacher_id ? `(${teacher.teacher_id})` : ''}</option>)}</select>
                <select value={filters.subject_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, subject_id: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} {subject.code ? `(${subject.code})` : ''}</option>)}</select>
                <select value={filters.day_of_week} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, day_of_week: event.target.value })); }} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All days</option>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
                <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium">Search</button>
            </form>

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
                                {data.data.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No timetable entries found.</td></tr>}
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
