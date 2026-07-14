'use client';

import { useEffect, useState } from 'react';

type Result = {
    id: string;
    marks_obtained: number;
    grade: string | null;
    remarks: string | null;
    created_at: string;
    exam: {
        name: string;
        max_marks: number;
        exam_date: string;
        subject: { name: string; code: string };
    };
};

export default function StudentResultsPage() {
    const [data, setData] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/student/results');
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load results');
                setData(json.data || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load results');
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

    // Calculate overall average for the header
    const totalPossible = data.reduce((acc, curr) => acc + curr.exam.max_marks, 0);
    const totalObtained = data.reduce((acc, curr) => acc + curr.marks_obtained, 0);
    const overallPercentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                        Academic Performance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        Exam <span className="text-emerald-600">Results</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Review your grades, marks, and faculty feedback
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Rank</p>
                            <p className="text-xl font-black text-slate-900 leading-none italic uppercase">Elite</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Average</p>
                            <p className="text-xl font-black text-emerald-600 leading-none tabular-nums">{overallPercentage}%</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            {error && (
                <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
                    <p className="text-rose-600 font-black uppercase tracking-widest text-xs">{error}</p>
                </div>
            )}

            <div className="grid gap-6">
                {data.map((res) => {
                    const percentage = Math.round((res.marks_obtained / res.exam.max_marks) * 100);
                    return (
                        <div key={res.id} className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 flex flex-col md:flex-row gap-8 items-center">
                            {/* Subject & Exam Info */}
                            <div className="flex-1 space-y-4 w-full text-center md:text-left">
                                <div className="space-y-1">
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-indigo-100 inline-block">
                                        {res.exam.subject.code}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic">
                                        {res.exam.subject.name}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{res.exam.name}</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-xs">📅</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(res.exam.exam_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-xs">💬</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{res.remarks || 'No remarks provided'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Ring/Gauge */}
                            <div className="relative w-28 h-28 shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                                    <circle 
                                        cx="56" cy="56" r="48" 
                                        stroke="currentColor" 
                                        strokeWidth="10" 
                                        fill="transparent" 
                                        strokeDasharray={301.6} 
                                        strokeDashoffset={301.6 * (1 - percentage / 100)} 
                                        className={`${percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000`} 
                                        strokeLinecap="round" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-slate-900 tracking-tighter">{percentage}%</span>
                                    <span className="text-[8px] font-black uppercase text-slate-400">Score</span>
                                </div>
                            </div>

                            {/* Raw Marks & Grade */}
                            <div className="flex flex-col items-center md:items-end justify-center shrink-0 space-y-2 min-w-[120px]">
                                <div className="text-right">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                                        {res.marks_obtained}<span className="text-slate-300 text-lg">/{res.exam.max_marks}</span>
                                    </p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Raw Marks</p>
                                </div>
                                <div className={`px-4 py-1 rounded-xl text-lg font-black uppercase tracking-widest border ${
                                    percentage >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    percentage >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                    {res.grade || (percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F')}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {data.length === 0 && (
                    <div className="py-24 text-center bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/50">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            📊
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">No Results Recorded</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-12 leading-relaxed">
                            Your academic results will appear here once faculty publishes your exam performance data.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
