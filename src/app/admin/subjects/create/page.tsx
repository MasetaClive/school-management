'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSubjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to create subject');
            }

            router.push('/admin/subjects');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create subject');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Add Subject</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Code *
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                            value={form.code}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                            }
                            placeholder="e.g. MATH101"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Name *
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            placeholder="e.g. Mathematics"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, description: e.target.value }))
                        }
                        placeholder="Optional subject description"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Subject'}
                </button>
            </form>
        </div>
    );
}
