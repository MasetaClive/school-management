'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Homework = {
    id: string;
    title: string;
    description: string | null;
    due_date: string;
    attachment_url: string | null;
    class: { name: string } | null;
    subject: { name: string; code: string } | null;
};

export default function TeacherHomeworkPage() {
    const [data, setData] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadHomework() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/teacher/homework');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to load homework');
            setData(json.data || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load homework');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadHomework();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this assignment permanently?')) return;
        try {
            const res = await fetch(`/api/teacher/homework/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to delete');
            }
            void loadHomework();
        } catch (e: any) {
            alert(e.message || 'Failed to delete assignment');
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Homework Management</h2>
                    <p className="text-xs text-slate-500 font-sans font-medium">Assign and track homework for your classes</p>
                </div>
                <Link
                    href="/teacher/homework/create"
                    className="rounded-[2rem] bg-indigo-600 px-6 py-3.5 text-center font-black uppercase text-xs text-white hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-100"
                >
                    Create Assignment
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="p-6 border border-red-100 bg-red-50 text-red-700 rounded-2xl text-xs font-black uppercase tracking-tight text-center">
                    {error}
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Title</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {data.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight">
                                            {h.class?.name || 'Unknown Class'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black mr-2 font-mono">
                                                {h.subject?.code || 'N/A'}
                                            </span>
                                            <span className="font-bold text-slate-700">{h.subject?.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{h.title}</p>
                                            {h.description && (
                                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-sm">{h.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-bold">
                                            {new Date(h.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-4">
                                            {h.attachment_url && (
                                                <a
                                                    href={h.attachment_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-emerald-600 hover:text-emerald-900 font-black uppercase tracking-wider text-[10px] hover:underline"
                                                >
                                                    Download
                                                </a>
                                            )}
                                            <Link 
                                                href={`/teacher/homework/${h.id}/edit`} 
                                                className="text-indigo-600 hover:text-indigo-900 font-black uppercase tracking-wider text-[10px] hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button 
                                                onClick={() => void handleDelete(h.id)} 
                                                className="text-rose-600 hover:text-rose-900 font-black uppercase tracking-wider text-[10px] hover:underline bg-transparent border-none cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No homework assignments created yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
