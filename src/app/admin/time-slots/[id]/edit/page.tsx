'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

type SlotData = {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
};

export default function EditTimeSlotPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        day_of_week: 1,
        start_time: '',
        end_time: '',
    });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/admin/time-slots/${id}`);
                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json.error ?? 'Failed to load time slot');
                }

                const s = json as SlotData;
                setForm({
                    day_of_week: s.day_of_week,
                    start_time: s.start_time.slice(0, 5), // Format HH:MM
                    end_time: s.end_time.slice(0, 5),
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load time slot');
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
            const res = await fetch(`/api/admin/time-slots/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error ?? 'Failed to update time slot');
            }

            router.push('/admin/time-slots');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update time slot');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Loading time slot...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Edit Time Slot</h2>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Day of Week *</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background cursor-pointer"
                        value={form.day_of_week}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, day_of_week: Number(e.target.value) }))
                        }
                        required
                    >
                        {DAYS.map((day, index) => (
                            <option key={index} value={index}>
                                {day}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Time *</label>
                        <input
                            type="time"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background cursor-pointer"
                            value={form.start_time}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, start_time: e.target.value }))
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Time *</label>
                        <input
                            type="time"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background cursor-pointer"
                            value={form.end_time}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, end_time: e.target.value }))
                            }
                            required
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
