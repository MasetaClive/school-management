'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditResultPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        marks_obtained: 0,
        remarks: '',
        student_name: '',
        exam_name: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/results/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error ?? 'Failed to load result');

                setForm({
                    marks_obtained: data.marks_obtained,
                    remarks: data.remarks || '',
                    student_name: data.student.full_name,
                    exam_name: data.exam.name,
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

        const payload = {
            marks_obtained: Number(form.marks_obtained),
            remarks: form.remarks || null,
        };

        try {
            const res = await fetch(`/api/admin/results/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to update result');

            router.push('/admin/results');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update result');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading result...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Result</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Student</label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground"
                            value={form.student_name}
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Exam</label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground"
                            value={form.exam_name}
                            disabled
                        />
                    </div>
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
                        rows={3}
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
