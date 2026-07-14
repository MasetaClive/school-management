'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type UserOption = { id: string; full_name: string; role: string };

function ComposeMessagePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const replyToId = searchParams.get('reply_to');

    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        recipient_id: '',
        subject: '',
        body: '',
    });

    const fetchUsers = useCallback(async (query: string) => {
        try {
            setLoadingUsers(true);
            const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setUsers(data || []);
        } catch (e) {
            setError('Failed to load user directory');
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchUsers(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchUsers]);

    useEffect(() => {
        if (!replyToId) return;
        async function loadReplyContext() {
            try {
                const resM = await fetch(`/api/messages/${replyToId}`);
                const dataM = await resM.json();
                if (resM.ok) {
                    setForm(f => ({
                        ...f,
                        recipient_id: dataM.sender_id,
                        subject: dataM.subject ? `Re: ${dataM.subject}` : 'Re: (No Subject)',
                        body: `\n\n--- On ${new Date(dataM.created_at).toLocaleString()}, ${dataM.sender.full_name} wrote:\n> ${dataM.body.split('\n').join('\n> ')}`,
                    }));
                    setUsers(current => {
                        const exists = current.find(u => u.id === dataM.sender_id);
                        if (exists) return current;
                        return [...current, { id: dataM.sender_id, full_name: dataM.sender.full_name, role: dataM.sender.role }];
                    });
                }
            } catch (e) {
                console.error('Failed to load reply context', e);
            }
        }
        void loadReplyContext();
    }, [replyToId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to send message');

            router.push('/messages');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to send message');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white/50 backdrop-blur-md border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden">
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href="/messages" className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] hover:underline">← Back to Inbox</Link>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Dispatch Message</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Constructing internal communication...</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => router.back()}
                            className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mx-8 mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="text-rose-600">⚠️</span>
                        <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Recipient Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Target Recipient</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by personnel name..."
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="w-full bg-white border-2 border-indigo-50 rounded-2xl px-4 py-4 text-xs font-black text-indigo-600 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                    value={form.recipient_id}
                                    onChange={(e) => setForm(f => ({ ...f, recipient_id: e.target.value }))}
                                    required
                                >
                                    <option value="">{loadingUsers ? 'SYNCING DIRECTORY...' : 'SELECT RECIPIENT...'}</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} className="font-bold py-2">
                                            {u.full_name.toUpperCase()} — {u.role.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Protocol Subject</label>
                            <input
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all h-[104px]"
                                value={form.subject}
                                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                                placeholder="Enter communication subject..."
                            />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Message Payload</label>
                        <textarea
                            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] px-8 py-8 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all min-h-[350px] shadow-inner leading-relaxed"
                            value={form.body}
                            onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                            placeholder="Begin transmission..."
                            required
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                        <div className="flex items-center gap-4 text-slate-400">
                            <span className="text-xl opacity-40">📎</span>
                            <span className="text-[10px] font-black uppercase tracking-widest cursor-not-allowed">Attach Records (Disabled)</span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-200 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? 'Transmitting...' : 'Transmit Message'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Background Decorations */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-rose-500/5 rounded-full blur-[100px] -ml-40 -mb-40" />
            </div>
        </div>
    );
}

export default function ComposeMessagePage() {
    return (
        <Suspense fallback={null}>
            <ComposeMessagePageContent />
        </Suspense>
    );
}
