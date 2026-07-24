'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateClassPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        grade_level: '',
        academic_year: new Date().getFullYear().toString(),
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to create class');
            }

            router.push('/admin/classes');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create class');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Add Class</h2>

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
                            placeholder="e.g. Class 10-A"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Form Level *
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.grade_level}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, grade_level: e.target.value }))
                            }
                            placeholder="e.g. 10"
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
                        placeholder="e.g. 2026"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Class'}
                </button>
            </form>
        </div>
    );
}
