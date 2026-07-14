'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditHomeworkPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        due_date: '',
        attachment_url: '',
        academic_year: '',
        class_name: '',
        subject_name: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/homework/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error ?? 'Failed to load homework');

                // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
                const date = new Date(data.due_date);
                const formattedDate = date.toISOString().slice(0, 16);

                setForm({
                    title: data.title,
                    description: data.description || '',
                    due_date: formattedDate,
                    attachment_url: data.attachment_url || '',
                    academic_year: data.academic_year,
                    class_name: data.class.name,
                    subject_name: data.subject.name,
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
            title: form.title,
            description: form.description || null,
            due_date: form.due_date,
            attachment_url: form.attachment_url || null,
            academic_year: form.academic_year,
        };

        try {
            const res = await fetch(`/api/admin/homework/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to update homework');

            router.push('/admin/homework');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update homework');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading homework...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Assignment</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Class (Read-only)</label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm bg-muted cursor-not-allowed"
                            value={form.class_name}
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject (Read-only)</label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm bg-muted cursor-not-allowed"
                            value={form.subject_name}
                            disabled
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date *</label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.due_date}
                            onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                            required
                        />
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
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Attachment URL</label>
                    <input
                        type="url"
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.attachment_url}
                        onChange={(e) => setForm(f => ({ ...f, attachment_url: e.target.value }))}
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
