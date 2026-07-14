'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Parent = {
    id: string;
    parent_id: string;
    full_name: string;
    phone: string;
    email: string | null;
    address: string | null;
    occupation: string | null;
};

export default function EditParentPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parent, setParent] = useState<Parent | null>(null);

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        occupation: '',
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/admin/parents/${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Failed to load parent');

                const p = json as Parent;
                setParent(p);
                setForm({
                    full_name: p.full_name ?? '',
                    phone: p.phone ?? '',
                    email: p.email ?? '',
                    address: p.address ?? '',
                    occupation: p.occupation ?? '',
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load parent');
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
            const res = await fetch(`/api/admin/parents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update parent');
            }

            router.push('/admin/parents');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update parent');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading parent...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!parent) return <p>Parent not found.</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Parent – {parent.parent_id}</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Full Name *
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.full_name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, full_name: e.target.value }))
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Phone *
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.phone}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, phone: e.target.value }))
                            }
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={form.email}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                        }
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Occupation
                    </label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={form.occupation}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, occupation: e.target.value }))
                        }
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Address
                    </label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        rows={3}
                        value={form.address}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, address: e.target.value }))
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
