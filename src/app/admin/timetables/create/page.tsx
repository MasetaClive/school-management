'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; name?: string; full_name?: string; code?: string; teacher_id?: string; start_time?: string; end_time?: string; day_of_week?: number; year?: string; grade_level?: string };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateTimetablePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [slots, setSlots] = useState<SelectOption[]>([]);
    const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);

    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        time_slot_id: '',
        academic_year: '',
    });

    useEffect(() => {
        async function loadOptions() {
            try {
                setLoadingOptions(true);
                const [resC, resS, resT, resSlots, resYears] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/subjects'),
                    fetch('/api/admin/teachers'),
                    fetch('/api/admin/timetables/slots'),
                    fetch('/api/admin/academic-years'),
                ]);

                const [dataC, dataS, dataT, dataSlots, dataYears] = await Promise.all([
                    resC.json(),
                    resS.json(),
                    resT.json(),
                    resSlots.json(),
                    resYears.json(),
                ]);

                if (!resC.ok || !resS.ok || !resT.ok || !resSlots.ok || !resYears.ok) throw new Error('Failed to load selection options');

                setClasses(dataC.data || []);
                setSubjects(dataS.data || []);
                setTeachers(dataT.data || []);
                setSlots(dataSlots.data || []);
                setAcademicYears(dataYears.data || []);
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

        try {
            const res = await fetch('/api/admin/timetables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to create entry');

            router.push('/admin/timetables');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create entry');
        } finally {
            setLoading(false);
        }
    }

    if (loadingOptions) return <p>Loading options...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">New Timetable Entry</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.class_id}
                        onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.grade_level ? `(${c.grade_level})` : ''}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Subject *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.subject_id}
                        onChange={(e) => setForm(f => ({ ...f, subject_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
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
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} {t.teacher_id ? `(${t.teacher_id})` : ''}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Time Slot *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.time_slot_id}
                        onChange={(e) => setForm(f => ({ ...f, time_slot_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Slot</option>
                        {slots.map(sl => (
                            <option key={sl.id} value={sl.id}>
                                {DAYS[sl.day_of_week!]} {sl.start_time?.slice(0, 5)} - {sl.end_time?.slice(0, 5)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Academic Year *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={form.academic_year}
                        onChange={(e) => setForm(f => ({ ...f, academic_year: e.target.value }))}
                        required
                    >
                        <option value="">Select academic year</option>
                        {academicYears.map((year) => <option key={year.id} value={year.year}>{year.year}</option>)}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Entry'}
                </button>
            </form>
        </div>
    );
}
