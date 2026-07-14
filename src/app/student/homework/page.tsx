'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Homework = {
    id: string;
    title: string;
    description: string | null;
    due_date: string;
    attachment_url: string | null;
    subject: { name: string; code: string };
    teacher: { full_name: string };
};

export default function StudentHomeworkPage() {
    const [data, setData] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await fetch('/api/student/homework');
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load homework');
                setData(json.data || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load homework');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
                        Academic Tasks
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        Assignments <span className="text-indigo-600">&</span> Tasks
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Track your due dates and manage your curriculum workload
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Active</p>
                        <p className="text-xl font-black text-slate-900 tabular-nums leading-none">{data.length}</p>
                    </div>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            {error && (
                <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
                    <p className="text-rose-600 font-black uppercase tracking-widest text-xs">{error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.map((h) => {
                    const isOverdue = new Date(h.due_date) < new Date();
                    return (
                        <div key={h.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-indigo-100 inline-block">
                                        {h.subject.code}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h.subject.name}</p>
                                </div>
                                <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                    isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {isOverdue ? 'Overdue' : 'Active'}
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight leading-snug">
                                {h.title}
                            </h3>
                            
                            <p className="text-xs font-medium text-slate-500 line-clamp-4 mb-8 leading-relaxed">
                                {h.description || 'Consult the course materials for full instructions on this assignment.'}
                            </p>
                            
                            <div className="mt-auto space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                                        <p className="text-[10px] font-black text-slate-800 uppercase tabular-nums">
                                            {new Date(h.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-xs">
                                        📅
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                                            {h.teacher.full_name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{h.teacher.full_name}</span>
                                    </div>
                                    
                                    {h.attachment_url && (
                                        <a 
                                            href={h.attachment_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                                        >
                                            View Files
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {data.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/50">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                            🎉
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Workspace Clear</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-10">
                            No assignments are currently pending for your class.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
