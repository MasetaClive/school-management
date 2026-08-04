'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/shared/FileUpload';

type Class = { id: string; name: string; academic_year: string };
type Subject = { id: string; name: string; code: string };

type EditHomeworkPageProps = {
    params: Promise<{ id: string }>;
};

export default function EditHomeworkPage({ params }: EditHomeworkPageProps) {
    const { id } = use(params);
    const router = useRouter();
    
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        due_date: '',
        attachment_url: '',
        academic_year: ''
    });
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                
                // 1. Fetch assigned classes & homework details
                const [classesRes, hwRes] = await Promise.all([
                    fetch('/api/teacher/classes'),
                    fetch(`/api/teacher/homework/${id}`)
                ]);

                if (!classesRes.ok) throw new Error('Failed to load assigned classes');
                if (!hwRes.ok) {
                    if (hwRes.status === 404) throw new Error('Homework assignment not found');
                    if (hwRes.status === 403) throw new Error('You do not have permission to edit this homework');
                    throw new Error('Failed to load homework details');
                }

                const classesJson = await classesRes.json();
                const hwJson = await hwRes.json();

                const classesList = classesJson.data || [];
                setClasses(classesList);

                // Format due date back to YYYY-MM-DD for date input
                const formattedDate = hwJson.due_date ? hwJson.due_date.split('T')[0] : '';

                setForm({
                    class_id: hwJson.class_id,
                    subject_id: hwJson.subject_id,
                    title: hwJson.title,
                    description: hwJson.description || '',
                    due_date: formattedDate,
                    attachment_url: hwJson.attachment_url || '',
                    academic_year: hwJson.academic_year
                });

            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred during form initialization');
            } finally {
                setLoading(false);
            }
        }
        void loadData();
    }, [id]);

    // Load subjects when class_id changes
    useEffect(() => {
        if (!form.class_id) {
            setSubjects([]);
            return;
        }

        async function loadSubjects() {
            try {
                const res = await fetch(`/api/teacher/subjects?class_id=${form.class_id}`);
                if (!res.ok) throw new Error('Failed to load subjects for this class');
                const json = await res.json();
                setSubjects(json.data || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load subjects');
            }
        }

        void loadSubjects();
    }, [form.class_id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.class_id || !form.subject_id) {
            alert('Please select a class and a subject');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            
            // Format due date as valid ISO string (end of due date)
            const formattedDueDate = new Date(`${form.due_date}T23:59:59.999Z`).toISOString();

            const payload = {
                class_id: form.class_id,
                subject_id: form.subject_id,
                title: form.title,
                description: form.description || null,
                due_date: formattedDueDate,
                attachment_url: form.attachment_url || null,
                academic_year: form.academic_year
            };

            const res = await fetch(`/api/teacher/homework/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to update homework assignment');
            }

            router.push('/teacher/homework');
        } catch (e: any) {
            setError(e.message || 'Failed to update homework assignment');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Edit Assignment</h2>
                <p className="text-xs text-slate-500 font-sans font-medium">Modify existing homework details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-100 bg-white p-8 md:p-10 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Class</label>
                        <select 
                            value={form.class_id}
                            onChange={(e) => {
                                const cls = classes.find(c => c.id === e.target.value);
                                setForm({ ...form, class_id: e.target.value, academic_year: cls?.academic_year || '' });
                            }}
                            className="w-full rounded-2xl border-2 border-indigo-50/50 p-4 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                            required
                        >
                            {classes.length === 0 && <option value="">No assigned classes</option>}
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Subject</label>
                        <select 
                            value={form.subject_id}
                            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                            className="w-full rounded-2xl border-2 border-indigo-50/50 p-4 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                            required
                            disabled={subjects.length === 0}
                        >
                            {subjects.length === 0 && <option value="">No assigned subjects</option>}
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignment Title</label>
                    <input 
                        type="text" 
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-2xl border-2 border-indigo-50/50 p-4 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. Chapter 4 Integration Exercises"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description / Instructions</label>
                    <textarea 
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-2xl border-2 border-indigo-50/50 p-4 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                        placeholder="Provide detailed instructions for the students..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Due Date</label>
                    <input 
                        type="date" 
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        className="w-full rounded-2xl border-2 border-indigo-50/50 p-4 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Upload Attachment (Optional)</label>
                    <FileUpload
                        bucket="homework-attachments"
                        onUploadStateChange={setUploadingAttachment}
                        onUploadComplete={(url) => {
                            setForm((prev) => ({ ...prev, attachment_url: url }));
                        }}
                        label="Choose file"
                    />
                    {form.attachment_url && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Attachment ready to save.</p>
                    )}
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-black uppercase tracking-tight text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-50">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="px-6 py-4 rounded-[2rem] font-black uppercase text-slate-500 tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={saving || subjects.length === 0 || uploadingAttachment}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-600 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-indigo-100"
                    >
                        {saving ? 'Updating...' : 'Save Assignment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
