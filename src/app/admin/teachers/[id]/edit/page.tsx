'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type TeacherData = {
    id: string;
    teacher_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    hire_date: string | null;
    qualification: string | null;
};

export default function EditTeacherPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teacherData, setTeacherData] = useState<TeacherData | null>(null);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        hire_date: '',
        qualification: '',
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/admin/teachers/${id}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Failed to load teacher');

                const t = json as TeacherData;
                setTeacherData(t);
                setForm({
                    full_name: t.full_name ?? '',
                    email: t.email ?? '',
                    phone: t.phone ?? '',
                    hire_date: t.hire_date ?? '',
                    qualification: t.qualification ?? '',
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load teacher');
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
            const payload = {
                ...form,
                email: form.email || null,
                phone: form.phone || null,
                hire_date: form.hire_date || null,
                qualification: form.qualification || null,
            };

            const res = await fetch(`/api/admin/teachers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update teacher');
            }

            router.push('/admin/teachers');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update teacher');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading teacher...</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!teacherData) return <p>Teacher not found.</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Teacher – {teacherData.teacher_id}</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid md:grid-cols-2 gap-4">
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
                            Phone
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.phone}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, phone: e.target.value }))
                            }
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Hire Date
                        </label>
                        <input
                            type="date"
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.hire_date}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, hire_date: e.target.value }))
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Qualification
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={form.qualification}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, qualification: e.target.value }))
                            }
                        />
                    </div>
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
