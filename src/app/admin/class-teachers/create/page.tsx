'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; grade_level?: string; teacher_id?: string; year?: string };

export default function CreateClassTeacherPage() {
    const router = useRouter();

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);
    const [loadingContext, setLoadingContext] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        class_id: '',
        teacher_id: '',
        is_homeroom: false,
        academic_year: '',
    });

    useEffect(() => {
        async function init() {
            try {
                const [resC, resT, resY] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/teachers'),
                    fetch('/api/admin/academic-years'),
                ]);
                const [dataC, dataT, dataY] = await Promise.all([resC.json(), resT.json(), resY.json()]);
                if (!resC.ok || !resT.ok || !resY.ok) throw new Error('Failed to load assignment options');
                setClasses(dataC.data || []);
                setTeachers(dataT.data || []);
                setAcademicYears(dataY.data || []);
            } catch (e) {
                setError('Failed to load classes or teachers');
            } finally {
                setLoadingContext(false);
            }
        }
        void init();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/class-teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to create assignment');

            router.push('/admin/class-teachers');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create assignment');
            setSubmitting(false);
        }
    }

    if (loadingContext) return <p className="p-8 text-sm">Loading directory...</p>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <h2 className="text-xl font-bold text-foreground">Assign Teacher to Class</h2>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-muted-foreground hover:text-foreground transition hover:underline"
                >
                    Cancel
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 font-bold mb-4 shadow-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-card p-8 rounded-lg border shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Class *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition"
                            value={form.class_id}
                            onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
                            required
                        >
                            <option value="">Select Class...</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.grade_level ? `(${c.grade_level})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Teacher *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition"
                            value={form.teacher_id}
                            onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
                            required
                        >
                            <option value="">Select Teacher...</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.full_name} {t.teacher_id ? `(${t.teacher_id})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Year *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition font-medium"
                            value={form.academic_year}
                            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                            required
                        >
                            <option value="">Select academic year...</option>
                            {academicYears.map((year) => <option key={year.id} value={year.year}>{year.year}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                        <input
                            type="checkbox"
                            id="is_homeroom"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={form.is_homeroom}
                            onChange={(e) => setForm((f) => ({ ...f, is_homeroom: e.target.checked }))}
                        />
                        <label htmlFor="is_homeroom" className="text-sm font-bold text-foreground">
                            Homeroom Teacher
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary text-primary-foreground px-8 py-2.5 rounded-md text-sm font-bold shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                    >
                        {submitting ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </form>

        </div>
    );
}
