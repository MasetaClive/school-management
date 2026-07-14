'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Class = { id: string; name: string; academic_year: string };
type Subject = { id: string; name: string; code: string };
type Teacher = { id: string; full_name: string };

export default function CreateHomeworkPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        due_date: '',
        attachment_url: '',
        academic_year: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [clsRes, subRes, userData] = await Promise.all([
                    fetch('/api/admin/classes'),
                    fetch('/api/admin/subjects'),
                    fetch('/api/auth/role') // Custom endpoint to get current related entity
                ]);
                
                const clsJson = await clsRes.json();
                const subJson = await subRes.json();
                
                setClasses(clsJson.data || []);
                setSubjects(subJson.data || []);
                
                // For now, let's assume we can fetch teacher info from a specific endpoint or just let the user pick.
                // In a real app, teacher_id would be pre-filled from session.
                // I'll add a fetch for the specific teacher linked to this user.
                const teacherRes = await fetch('/api/admin/teachers');
                const teacherJson = await teacherRes.json();
                setTeacher(teacherJson.data?.[0] || null); // TEMPORARY: Pick first teacher for demo
                
                if (clsJson.data?.[0]) {
                    setForm(f => ({ ...f, class_id: clsJson.data[0].id, academic_year: clsJson.data[0].academic_year }));
                }
                if (subJson.data?.[0]) {
                    setForm(f => ({ ...f, subject_id: subJson.data[0].id }));
                }
            } catch (e) {
                setError('Failed to initialize form');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!teacher) {
            alert('Teacher data not found');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const res = await fetch('/api/admin/homework', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    teacher_id: teacher.id,
                    due_date: new Date(form.due_date).toISOString()
                }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to create homework');
            }
            router.push('/teacher/homework');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create homework');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="p-8 text-center text-muted-foreground">Initializing form...</p>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Create New Homework</h2>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Select Class</label>
                        <select 
                            value={form.class_id}
                            onChange={(e) => {
                                const cls = classes.find(c => c.id === e.target.value);
                                setForm({ ...form, class_id: e.target.value, academic_year: cls?.academic_year || '' });
                            }}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            required
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Subject</label>
                        <select 
                            value={form.subject_id}
                            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            required
                        >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Assignment Title</label>
                    <input 
                        type="text" 
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="e.g. Chapter 5 Exercises"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Description / Instructions</label>
                    <textarea 
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Provide detailed instructions for the students..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Due Date</label>
                        <input 
                            type="date" 
                            value={form.due_date}
                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Attachment URL (Optional)</label>
                        <input 
                            type="url" 
                            value={form.attachment_url}
                            onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Link to resource"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <div className="flex justify-end gap-3 pt-4">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium hover:underline"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                        {saving ? 'Creating...' : 'Create Assignment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
