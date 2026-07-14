'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; code?: string };

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        name: '',
        class_id: '',
        subject_id: '',
        exam_date: new Date().toISOString().split('T')[0],
        max_marks: 100,
        academic_year: new Date().getFullYear().toString(),
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const [resC, resS] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/subjects'),
                ]);

                const [dataC, dataS] = await Promise.all([
                    resC.json(),
                    resS.json(),
                ]);

                setClasses(dataC.data || []);
                setSubjects(dataS.data || []);
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
                        placeholder="e.g. Midterm Session"
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
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.academic_year}
                        onChange={(e) => setForm(f => ({ ...f, academic_year: e.target.value }))}
                        required
                    />
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
