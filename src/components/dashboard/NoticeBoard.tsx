'use client';

import { useEffect, useState } from 'react';

type Announcement = {
    id: string;
    title: string;
    content: string;
    published_at: string;
};

export default function NoticeBoard() {
    const [notices, setNotices] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/admin/announcements'); 
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || 'Failed to load announcements');
                if (!Array.isArray(data)) throw new Error('Invalid announcements response');
                setNotices(data.slice(0, 3));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load announcements');
                console.error('Notice Board error', e);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    if (loading) {
        return (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 animate-pulse">
                <div className="h-4 w-32 bg-slate-100 rounded-full mb-8" />
                <div className="space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="h-4 w-full bg-slate-50 rounded-full" />
                            <div className="h-3 w-2/3 bg-slate-50 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (notices.length === 0) return null;

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Notice Board</h3>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <div className="space-y-8">
                {notices.map((n, i) => (
                    <div key={n.id} className="relative pl-6 border-l-2 border-indigo-50 hover:border-indigo-500 transition-colors group/item">
                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-indigo-100 group-hover/item:bg-indigo-600 transition-colors" />
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tight group-hover/item:text-indigo-600 transition-colors">
                                {n.title}
                            </h4>
                            <span className="text-[9px] font-black text-slate-400 tabular-nums uppercase tracking-widest whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded ml-4">
                                {n.published_at ? new Date(n.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {n.content}
                        </p>
                    </div>
                ))}
            </div>

            <button className="w-full mt-10 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                Archive Directory
            </button>
        </div>
    );
}
