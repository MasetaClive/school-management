'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; grade_level?: string; teacher_id?: string; year?: string };

export default function EditClassTeacherPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        class_id: '',
        teacher_id: '',
        is_homeroom: false,
        academic_year: '',
    });
    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [assignmentResponse, classesResponse, teachersResponse, yearsResponse] = await Promise.all([
                    fetch(`/api/admin/class-teachers/${id}`),
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/teachers'),
                    fetch('/api/admin/academic-years'),
                ]);
                const [data, classesData, teachersData, yearsData] = await Promise.all([
                    assignmentResponse.json(), classesResponse.json(), teachersResponse.json(), yearsResponse.json(),
                ]);
                if (!assignmentResponse.ok) throw new Error(data.error ?? 'Failed to load assignment');
                if (!classesResponse.ok || !teachersResponse.ok || !yearsResponse.ok) throw new Error('Failed to load assignment options');
                setClasses(classesData.data ?? []);
                setTeachers(teachersData.data ?? []);
                setAcademicYears(yearsData.data ?? []);
                setForm({
                    class_id: data.class_id,
                    teacher_id: data.teacher_id,
                    is_homeroom: data.is_homeroom,
                    academic_year: data.academic_year,
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load assignment');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/class-teachers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to update assignment');

            router.push('/admin/class-teachers');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update assignment');
            setSubmitting(false);
        }
    }

    if (loading) return <p className="p-8 text-sm">Loading assignment details...</p>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <h2 className="text-xl font-bold">Edit Class Teacher Assignment</h2>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-muted-foreground hover:text-foreground"
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
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Class *</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.class_id} onChange={(e) => setForm((current) => ({ ...current, class_id: e.target.value }))} required>
                            <option value="">Select class...</option>
                            {classes.map((classOption) => <option key={classOption.id} value={classOption.id}>{classOption.name} {classOption.grade_level ? `(${classOption.grade_level})` : ''}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Teacher *</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.teacher_id} onChange={(e) => setForm((current) => ({ ...current, teacher_id: e.target.value }))} required>
                            <option value="">Select teacher...</option>
                            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name} {teacher.teacher_id ? `(${teacher.teacher_id})` : ''}</option>)}
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
                        {submitting ? 'Saving...' : 'Update Assignment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
