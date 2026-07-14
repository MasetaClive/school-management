'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string };

export default function EditSubjectAssignmentPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [classes, setClasses] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        teacher_id: '',
        subject_id: '',
        class_id: '',
        academic_year: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [resA, resT, resS, resC] = await Promise.all([
                    fetch(`/api/admin/subject-assignments/${id}`),
                    fetch('/api/admin/teachers'),
                    fetch('/api/admin/subjects'),
                    fetch('/api/admin/classes'),
                ]);

                const [dataA, dataT, dataS, dataC] = await Promise.all([
                    resA.json(),
                    resT.json(),
                    resS.json(),
                    resC.json(),
                ]);

                if (!resA.ok) throw new Error(dataA.error ?? 'Failed to load assignment');

                setTeachers(dataT.data || []);
                setSubjects(dataS.data || []);
                setClasses(dataC.data || []);

                setForm({
                    teacher_id: dataA.teacher_id,
                    subject_id: dataA.subject_id,
                    class_id: dataA.class_id,
                    academic_year: dataA.academic_year,
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }
        void loadData();
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/subject-assignments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update assignment');
            }

            router.push('/admin/subject-assignments');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update assignment');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading assignment details...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Subject Assignment</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Teacher *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.teacher_id}
                        onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.full_name} ({t.teacher_id})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Subject *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.subject_id}
                        onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.class_id}
                        onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.grade_level})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Academic Year *</label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={form.academic_year}
                        onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
