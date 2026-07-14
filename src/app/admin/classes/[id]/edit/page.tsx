'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type ClassData = {
    id: string;
    name: string;
    grade_level: number;
    academic_year: string;
};

export default function EditClassPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classData, setClassData] = useState<ClassData | null>(null);

    const [form, setForm] = useState({
        name: '',
        grade_level: '',
        academic_year: '',
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/admin/classes/${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Failed to load class');

                const c = json as ClassData;
                setClassData(c);
                setForm({
                    name: c.name ?? '',
                    grade_level: String(c.grade_level ?? ''),
                    academic_year: c.academic_year ?? '',
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load class');
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/classes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update class');
            }

            router.push('/admin/classes');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update class');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading class...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!classData) return <p>Class not found.</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Class</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Class Name *
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Grade Level *
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.grade_level}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, grade_level: e.target.value }))
                            }
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Academic Year *
                    </label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={form.academic_year}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, academic_year: e.target.value }))
                        }
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
