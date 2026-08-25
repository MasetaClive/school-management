'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Message = {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string | null;
    body: string;
    is_read: boolean;
    created_at: string;
    sender?: { full_name: string; role: string };
    recipient?: { full_name: string; role: string };
};

type ListResponse = {
    data: Message[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function MessagesPage() {
    const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/messages/${folder}?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load messages');
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [folder, page]);

    useEffect(() => {
        void load();
    }, [load]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-700">
            {/* Left Sidebar */}
            <div className="w-64 flex flex-col gap-6">
                <Link
                    href="/messages/compose"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] text-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="text-sm">+</span> Compose
                </Link>

                <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-[2rem] p-4 flex-1 shadow-xl shadow-slate-200/50">
                    <nav className="space-y-2">
                        {[
                            { id: 'inbox', label: 'Inbox', icon: '📥' },
                            { id: 'sent', label: 'Sent', icon: '📤' },
                            { id: 'starred', label: 'Starred', icon: '⭐', disabled: true },
                            { id: 'drafts', label: 'Drafts', icon: '📝', disabled: true },
                            { id: 'trash', label: 'Trash', icon: '🗑️', disabled: true },
                        ].map((item) => (
                            <button
                                key={item.id}
                                disabled={item.disabled}
                                onClick={() => { if (!item.disabled) { setFolder(item.id as any); setPage(1); } }}
                                className={`w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all ${
                                    folder === item.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                        : 'text-slate-600 hover:bg-white hover:shadow-md'
                                } ${item.disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                {item.id === 'inbox' && !loading && (data?.total || 0) > 0 && folder !== 'inbox' && (
                                    <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                                        {data?.total}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Search & Header */}
                <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input 
                            type="text"
                            placeholder="Filter by subject or sender..."
                            className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={load} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">🔄</button>
                        <div className="h-8 w-px bg-slate-200 mx-2" />
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm text-xs"
                            >←</button>
                            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-tighter">Page {page} of {data?.totalPages || 1}</span>
                            <button 
                                disabled={page >= (data?.totalPages || 1)}
                                onClick={() => setPage(p => p + 1)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm text-xs"
                            >→</button>
                        </div>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Cryptographic Channels...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="text-4xl">⚠️</div>
                            <p className="text-xs font-bold text-rose-500">{error}</p>
                            <button onClick={load} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Retry Connection</button>
                        </div>
                    ) : data?.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30 italic">
                            <div className="text-6xl mb-2">📭</div>
                            <p className="text-xs font-bold">Your {folder} is currently deserted.</p>
                        </div>
                    ) : (
                        data?.data.map((msg) => (
                            <Link 
                                key={msg.id}
                                href={`/messages/${msg.id}`}
                                className={`group block relative overflow-hidden bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300 ${
                                    folder === 'inbox' && !msg.is_read ? 'border-l-4 border-l-indigo-600' : ''
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Sender Avatar */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-transform group-hover:scale-110 ${
                                        folder === 'inbox' && !msg.is_read ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {getInitials(folder === 'inbox' ? msg.sender?.full_name || 'System' : msg.recipient?.full_name || 'User')}
                                    </div>

                                    {/* Message Info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black uppercase tracking-tight truncate ${
                                                    folder === 'inbox' && !msg.is_read ? 'text-slate-900' : 'text-slate-600'
                                                }`}>
                                                    {folder === 'inbox' ? msg.sender?.full_name || 'System' : msg.recipient?.full_name || 'User'}
                                                </span>
                                                <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                    {folder === 'inbox' ? msg.sender?.role : msg.recipient?.role}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                                {formatDate(msg.created_at)}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm tracking-tight truncate ${
                                            folder === 'inbox' && !msg.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                                        }`}>
                                            {msg.subject || '(No Subject)'}
                                        </h4>
                                        <p className="text-xs text-slate-400 line-clamp-1 font-medium">
                                            {msg.body}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                        <span className="text-indigo-600 text-lg">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </div>
    );
}
