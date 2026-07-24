'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; code?: string; full_name?: string; teacher_id?: string; grade_level?: string; year?: string };

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        name: '',
        class_id: '',
        subject_id: '',
        teacher_id: '', exam_type: 'assessment', exam_date: '',
        max_marks: 100,
        academic_year: '',
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const [resC, resS, resT, resY] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/subjects'),
                    fetch('/api/admin/teachers'), fetch('/api/admin/academic-years'),
                ]);

                const [dataC, dataS, dataT, dataY] = await Promise.all([
                    resC.json(),
                    resS.json(),
                    resT.json(), resY.json(),
                ]);

                if (!resC.ok || !resS.ok || !resT.ok || !resY.ok) throw new Error('Failed to load selection options');

                setClasses(dataC.data || []);
                setSubjects(dataS.data || []);
                setTeachers(dataT.data || []); setAcademicYears(dataY.data || []);
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

        const payload = {
            ...form,
            max_marks: Number(form.max_marks),
        };

        try {
            const res = await fetch('/api/admin/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to create exam');

            router.push('/admin/exams');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create exam');
        } finally {
            setLoading(false);
        }
    }

    if (loadingOptions) return <p>Loading options...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">New Exam</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Exam Name *</label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                    />
                </div>

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

                <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Teacher *</label><select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.teacher_id} onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))} required><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} {t.teacher_id ? `(${t.teacher_id})` : ''}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Exam Type *</label><select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.exam_type} onChange={(e) => setForm(f => ({ ...f, exam_type: e.target.value }))} required><option value="assessment">Assessment</option><option value="quiz">Quiz</option><option value="test">Test</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="practical">Practical</option></select></div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Exam Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.exam_date}
                            onChange={(e) => setForm(f => ({ ...f, exam_date: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Marks *</label>
                        <input
                            type="number"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.max_marks}
                            onChange={(e) => setForm(f => ({ ...f, max_marks: Number(e.target.value) }))}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Academic Year *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.academic_year}
                        onChange={(e) => setForm(f => ({ ...f, academic_year: e.target.value }))}
                        required
                    ><option value="">Select academic year</option>{academicYears.map(year => <option key={year.id} value={year.year}>{year.year}</option>)}</select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Exam'}
                </button>
            </form>
        </div>
    );
}
