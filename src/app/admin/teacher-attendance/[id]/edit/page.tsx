'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; teacher_id?: string };

export default function EditTeacherAttendancePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [teachers, setTeachers] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        teacher_id: '',
        attendance_date: '',
        status: 'present',
        remarks: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [resR, resT] = await Promise.all([
                    fetch(`/api/admin/teacher-attendance/${id}`),
                    fetch('/api/admin/teachers'),
                ]);

                const [dataR, dataT] = await Promise.all([
                    resR.json(),
                    resT.json(),
                ]);

                if (!resR.ok) throw new Error(dataR.error ?? 'Failed to load record');

                setTeachers(dataT.data || []);

                setForm({
                    teacher_id: dataR.teacher_id,
                    attendance_date: dataR.attendance_date,
                    status: dataR.status,
                    remarks: dataR.remarks || '',
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
            ...form,
            remarks: form.remarks || null,
        };

        try {
            const res = await fetch(`/api/admin/teacher-attendance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to update record');

            router.push('/admin/teacher-attendance');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update record');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading record...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Teacher Attendance</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.attendance_date}
                            onChange={(e) => setForm(f => ({ ...f, attendance_date: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status *</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.status}
                            onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                            required
                        >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Teacher (Read-only)</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-muted cursor-not-allowed"
                        value={form.teacher_id}
                        disabled
                    >
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_id})</option>)}
                    </select>
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
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
