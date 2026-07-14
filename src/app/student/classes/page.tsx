'use client';

import { useEffect, useState } from 'react';

type SubjectAssignment = {
    id: string;
    subject: { name: string; code: string; description: string | null };
    teacher: { full_name: string; email: string | null };
};

export default function StudentClassesPage() {
    const [data, setData] = useState<SubjectAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/student/classes');
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load classes');
                setData(json.data || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load classes');
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
                        Academic Enrollment
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        My <span className="text-indigo-600">Curriculum</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Manage your active subjects and connect with your instructors
                    </p>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            {error && (
                <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
                    <p className="text-rose-600 font-black uppercase tracking-widest text-xs">{error}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.map((item) => (
                    <div key={item.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                📚
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Code</p>
                                <p className="text-sm font-black text-slate-900">{item.subject.code}</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">
                            {item.subject.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mb-8 line-clamp-3 leading-relaxed">
                            {item.subject.description || 'Comprehensive curriculum covering core principles and advanced applications in this domain.'}
                        </p>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                                    {item.teacher.full_name.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{item.teacher.full_name}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instructor</p>
                                </div>
                            </div>
                            <button className="text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Resources →</button>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem]">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No subjects assigned for the current period</p>
                    </div>
                )}
            </div>
        </div>
    );
}
