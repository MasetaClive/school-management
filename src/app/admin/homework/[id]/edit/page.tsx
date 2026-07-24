'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string; year?: string };

export default function EditHomeworkPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);
    const [form, setForm] = useState({
        class_id: '', subject_id: '', teacher_id: '', title: '', description: '', due_date: '', attachment_url: '', academic_year: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [homeworkResponse, classesResponse, subjectsResponse, teachersResponse, yearsResponse] = await Promise.all([
                    fetch(`/api/admin/homework/${id}`), fetch('/api/admin/classes'), fetch('/api/admin/subjects'),
                    fetch('/api/admin/teachers'), fetch('/api/admin/academic-years'),
                ]);
                const [homework, classesData, subjectsData, teachersData, yearsData] = await Promise.all([
                    homeworkResponse.json(), classesResponse.json(), subjectsResponse.json(), teachersResponse.json(), yearsResponse.json(),
                ]);
                if (!homeworkResponse.ok) throw new Error(homework.error ?? 'Failed to load homework');
                if (!classesResponse.ok || !subjectsResponse.ok || !teachersResponse.ok || !yearsResponse.ok) throw new Error('Failed to load homework options');
                setClasses(classesData.data ?? []);
                setSubjects(subjectsData.data ?? []);
                setTeachers(teachersData.data ?? []);
                setAcademicYears(yearsData.data ?? []);
                setForm({
                    class_id: homework.class_id, subject_id: homework.subject_id, teacher_id: homework.teacher_id,
                    title: homework.title, description: homework.description ?? '',
                    due_date: new Date(homework.due_date).toISOString().slice(0, 16),
                    attachment_url: homework.attachment_url ?? '', academic_year: homework.academic_year,
                });
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Failed to load homework');
            } finally {
                setLoading(false);
            }
        }
        void loadData();
    }, [id]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/homework/${id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, due_date: new Date(form.due_date).toISOString(), description: form.description || null, attachment_url: form.attachment_url || '' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Failed to update homework');
            router.push('/admin/homework');
            router.refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Failed to update homework');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading homework...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Assignment</h2>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm font-medium">Class *<select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.class_id} onChange={(e) => setForm((current) => ({ ...current, class_id: e.target.value }))} required><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} {item.grade_level ? `(${item.grade_level})` : ''}</option>)}</select></label>
                    <label className="block text-sm font-medium">Subject *<select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.subject_id} onChange={(e) => setForm((current) => ({ ...current, subject_id: e.target.value }))} required><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name} {item.code ? `(${item.code})` : ''}</option>)}</select></label>
                </div>
                <label className="block text-sm font-medium">Teacher *<select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.teacher_id} onChange={(e) => setForm((current) => ({ ...current, teacher_id: e.target.value }))} required><option value="">Select teacher</option>{teachers.map((item) => <option key={item.id} value={item.id}>{item.full_name} {item.teacher_id ? `(${item.teacher_id})` : ''}</option>)}</select></label>
                <label className="block text-sm font-medium">Title *<input className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} required /></label>
                <label className="block text-sm font-medium">Description<textarea className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows={4} /></label>
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm font-medium">Due Date *<input type="datetime-local" className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.due_date} onChange={(e) => setForm((current) => ({ ...current, due_date: e.target.value }))} required /></label>
                    <label className="block text-sm font-medium">Academic Year *<select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.academic_year} onChange={(e) => setForm((current) => ({ ...current, academic_year: e.target.value }))} required><option value="">Select academic year</option>{academicYears.map((year) => <option key={year.id} value={year.year}>{year.year}</option>)}</select></label>
                </div>
                <label className="block text-sm font-medium">Attachment URL<input type="url" className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.attachment_url} onChange={(e) => setForm((current) => ({ ...current, attachment_url: e.target.value }))} /></label>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
        </div>
    );
}
