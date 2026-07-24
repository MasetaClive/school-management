'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; grade_level?: string; year?: string };

export default function CreateHomeworkPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        title: '',
        description: '',
        due_date: '',
        attachment_url: '',
        academic_year: '',
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const [resC, resS, resT, resY] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/subjects'),
                    fetch('/api/admin/teachers'),
                    fetch('/api/admin/academic-years'),
                ]);

                const [dataC, dataS, dataT, dataY] = await Promise.all([
                    resC.json(),
                    resS.json(),
                    resT.json(),
                    resY.json(),
                ]);

                if (!resC.ok || !resS.ok || !resT.ok || !resY.ok) throw new Error('Failed to load selection options');

                setClasses(dataC.data || []);
                setSubjects(dataS.data || []);
                setTeachers(dataT.data || []);
                setAcademicYears(dataY.data || []);
            } catch (e) {
                setError('Failed to load selection options');
            } finally {
                setLoadingOptions(false);
            }
        }
        void loadOptions();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/homework', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, due_date: new Date(form.due_date).toISOString() }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to create homework');

            router.push('/admin/homework');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create homework');
        } finally {
            setLoading(false);
        }
    }

    if (loadingOptions) return <p>Loading options...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Assign New Homework</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Class *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.class_id}
                            onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))}
                            required
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.grade_level ? `(${c.grade_level})` : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.subject_id}
                            onChange={(e) => setForm(f => ({ ...f, subject_id: e.target.value }))}
                            required
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Teacher *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.teacher_id}
                        onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} {t.teacher_id ? `(${t.teacher_id})` : ''}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Instructions for students..."
                        rows={4}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date *</label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.due_date}
                            onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Academic Year *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.academic_year}
                            onChange={(e) => setForm(f => ({ ...f, academic_year: e.target.value }))}
                            required
                        >
                            <option value="">Select academic year</option>
                            {academicYears.map((year) => <option key={year.id} value={year.year}>{year.year}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Attachment URL</label>
                    <input
                        type="url"
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.attachment_url}
                        onChange={(e) => setForm(f => ({ ...f, attachment_url: e.target.value }))}
                        placeholder="Link to handout or resource (optional)"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Assign Homework'}
                </button>
            </form>
        </div>
    );
}
