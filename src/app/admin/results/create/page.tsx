'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; student_id?: string };

export default function CreateResultPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [exams, setExams] = useState<SelectOption[]>([]);
    const [students, setStudents] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        exam_id: '',
        student_id: '',
        marks_obtained: 0,
        remarks: '',
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const [resE, resS] = await Promise.all([
                    fetch('/api/admin/exams'),
                    fetch('/api/admin/students'),
                ]);

                const [dataE, dataS] = await Promise.all([
                    resE.json(),
                    resS.json(),
                ]);

                setExams(dataE.data || []);
                setStudents(dataS.data || []);
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
            marks_obtained: Number(form.marks_obtained),
            remarks: form.remarks || null,
        };

        try {
            const res = await fetch('/api/admin/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to record result');

            router.push('/admin/results');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to record result');
        } finally {
            setLoading(false);
        }
    }

    if (loadingOptions) return <p>Loading options...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Record Exam Result</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Exam *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.exam_id}
                        onChange={(e) => setForm(f => ({ ...f, exam_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Exam</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Student *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.student_id}
                        onChange={(e) => setForm(f => ({ ...f, student_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
                    </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Marks Obtained *</label>
                        <input
                            type="number"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.marks_obtained}
                            onChange={(e) => setForm(f => ({ ...f, marks_obtained: Number(e.target.value) }))}
                            required
                            min="0"
                        />
                    </div>
                    <p className="self-end text-sm text-muted-foreground">Grade and pass/fail status are calculated automatically.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.remarks}
                        onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                        placeholder="Optional notes..."
                        rows={3}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Record Result'}
                </button>
            </form>
        </div>
    );
}
