'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditClassTeacherPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        class_name: '',
        teacher_name: '',
        is_homeroom: false,
        academic_year: '',
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/admin/class-teachers/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Failed to load assignment');
                setForm({
                    class_name: `${data.class.name} (${data.class.grade_level})`,
                    teacher_name: data.teacher.full_name,
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
                body: JSON.stringify({
                    is_homeroom: form.is_homeroom,
                    academic_year: form.academic_year,
                }),
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
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Class (Read Only)</label>
                        <div className="px-3 py-2 bg-muted/30 border rounded-md text-sm font-medium text-muted-foreground">
                            {form.class_name}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Teacher (Read Only)</label>
                        <div className="px-3 py-2 bg-muted/30 border rounded-md text-sm font-medium text-muted-foreground">
                            {form.teacher_name}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Year *</label>
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition font-medium"
                            value={form.academic_year}
                            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                            required
                        />
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
