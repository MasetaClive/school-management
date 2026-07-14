'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; teacher_id?: string };

export default function CreateTeacherAttendancePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [teachers, setTeachers] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        teacher_id: '',
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: '',
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const res = await fetch('/api/admin/teachers');
                const json = await res.json();
                setTeachers(json.data || []);
            } catch (e) {
                setError('Failed to load selection options');
            } finally {
                setLoadingOptions(false);
            }
        }
        void loadOptions();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            ...form,
            remarks: form.remarks || null,
        };

        try {
            const res = await fetch('/api/admin/teacher-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to record attendance');

            router.push('/admin/teacher-attendance');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to record attendance');
        } finally {
            setLoading(false);
        }
    }

    if (loadingOptions) return <p>Loading options...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Record Teacher Attendance</h2>

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
                    <label className="block text-sm font-medium mb-1">Teacher *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.teacher_id}
                        onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Teacher</option>
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
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Record Attendance'}
                </button>
            </form>
        </div>
    );
}
