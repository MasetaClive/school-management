'use client';

import { useEffect, useState } from 'react';

type Log = {
    id: string;
    event_type: string;
    metadata: { title?: string; body?: string };
    created_at: string;
};

export default function NotificationBell() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [open, setOpen] = useState(false);

    // Since notification_logs doesn't have is_read, we'll treat all as unread for now
    const unreadCount = logs.length; 

    useEffect(() => {
        const load = async () => {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        };
        void load();
    }, []);

    return (
        <div className="relative">
            <button 
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-full hover:bg-muted transition"
                suppressHydrationWarning
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alerts</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto divide-y">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground italic">No alerts yet</div>
                        ) : (
                            logs.map(n => (
                                <div 
                                    key={n.id} 
                                    className="p-4 transition cursor-pointer hover:bg-slate-50 bg-blue-50/10"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-xs font-bold text-primary">{n.metadata.title || n.event_type}</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-snug">{n.metadata.body}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
