'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type MessageDetail = {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string | null;
    body: string;
    is_read: boolean;
    created_at: string;
    sender: { full_name: string; role: string; id: string };
    recipient: { full_name: string; role: string; id: string };
};

export default function MessageDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [data, setData] = useState<MessageDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch(`/api/messages/${id}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load message');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load message');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [id]);

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? 'Failed to delete message');
            }
            router.push('/messages');
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete message');
        }
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Decrypting Protocol Stream...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-12 bg-white rounded-[2.5rem] border border-rose-100 shadow-2xl text-center space-y-4">
                <div className="text-5xl">📡</div>
                <h2 className="text-xl font-black text-rose-600 uppercase italic">Signal Lost</h2>
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">{error}</p>
                <Link href="/messages" className="inline-block mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Return to Terminal</Link>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <Link href="/messages" className="hover:text-indigo-600 transition-colors">Terminal</Link>
                <span className="opacity-30">/</span>
                <span className="text-indigo-600 italic">Message Detail</span>
            </div>

            <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] shadow-2xl shadow-indigo-100/50 overflow-hidden relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />

                {/* Header */}
                <div className="relative p-8 md:p-12 border-b border-slate-50 bg-white/50">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 border-4 border-white shrink-0">
                                {getInitials(data.sender.full_name)}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                    {data.subject || '(No Subject)'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-widest">{data.sender.role}</span>
                                    <span className="text-xs font-bold text-slate-800 italic">{data.sender.full_name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">→ to {data.recipient.full_name}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-widest pt-1">
                                    {new Date(data.created_at).toLocaleString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 shrink-0">
                            <Link
                                href={`/messages/compose?reply_to=${data.id}`}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-100 active:scale-95"
                            >
                                Reply Signal
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="px-8 py-4 bg-white border border-slate-100 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="relative p-10 md:p-16 min-h-[400px]">
                    <div className="max-w-3xl mx-auto">
                        <div className="whitespace-pre-wrap text-base md:text-lg font-medium text-slate-700 leading-relaxed font-sans">
                            {data.body}
                        </div>
                    </div>
                </div>

                {/* Footer / Status */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmission Protocol: Secure Internal Directory</p>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                            data.is_read 
                                ? 'bg-slate-100 border-slate-200 text-slate-500' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${data.is_read ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{data.is_read ? 'Archived/Read' : 'Direct/New'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-center gap-4 py-4">
                <Link href="/messages" className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all shadow-sm">
                    Back to Terminal
                </Link>
                <div className="w-px h-4 bg-slate-200" />
                <button 
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
                >
                    Print Record
                </button>
            </div>
        </div>
    );
}
