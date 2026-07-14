'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type SubjectData = {
    id: string;
    name: string;
    code: string;
    description: string | null;
};

export default function EditSubjectPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subjectData, setSubjectData] = useState<SubjectData | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/admin/subjects/${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Failed to load subject');

                const s = json as SubjectData;
                setSubjectData(s);
                setForm({
                    name: s.name ?? '',
                    description: s.description ?? '',
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load subject');
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
            const res = await fetch(`/api/admin/subjects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update subject');
            }

            router.push('/admin/subjects');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update subject');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading subject...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!subjectData) return <p>Subject not found.</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Subject – {subjectData.code}</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                        required
                    />
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
