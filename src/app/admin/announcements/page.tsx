'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage, requestJson } from '@/lib/api-client';

type Announcement = {
    id: string;
    title: string;
    content: string;
    target_roles: string[] | null;
    is_published: boolean;
    published_at: string;
};

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newMsg, setNewMsg] = useState({ title: '', content: '', target_roles: [] as string[] });

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const data = await requestJson<unknown>('/api/admin/announcements?all=true');
            if (!Array.isArray(data)) throw new Error('The announcements response was invalid.');
            setAnnouncements(data);
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to load announcements. Please try again.'));
        } finally {
            setLoading(false);
        }
    }

    const toggleRole = (role: string) => {
        setNewMsg(prev => ({
            ...prev,
            target_roles: prev.target_roles.includes(role)
                ? prev.target_roles.filter(r => r !== role)
                : [...prev.target_roles, role]
        }));
    };

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            setPublishing(true);
            setError(null);
            await requestJson('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newMsg,
                    target_roles: newMsg.target_roles.length === 0 ? null : newMsg.target_roles,
                    is_published: true
                })
            });
            setShowAdd(false);
            setNewMsg({ title: '', content: '', target_roles: [] });
            await load();
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to post the announcement. Please try again.'));
        } finally {
            setPublishing(false);
        }
    }

    const ROLES = ['admin', 'teacher', 'student', 'parent'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight text-primary">School Announcements</h2>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow-md"
                >
                    {showAdd ? 'Cancel' : 'Post New Notice'}
                </button>
            </div>

            {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            {showAdd && (
                <form onSubmit={handleCreate} className="p-8 border rounded-xl bg-card shadow-lg space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Title</label>
                        <input 
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="e.g. Annual Sports Day 2024"
                            value={newMsg.title}
                            onChange={e => setNewMsg({...newMsg, title: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Target Audience (Select Multiple)</label>
                        <div className="flex flex-wrap gap-2">
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                                        newMsg.target_roles.includes(role)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-muted text-muted-foreground hover:border-primary'
                                    }`}
                                >
                                    {role.toUpperCase()}
                                </button>
                            ))}
                            <span className="text-[10px] text-muted-foreground flex items-center ml-2 italic">
                                {newMsg.target_roles.length === 0 ? '(Selected: Everyone)' : ''}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Message Content</label>
                        <textarea 
                            className="w-full border p-2 rounded text-sm min-h-[100px]" 
                            placeholder="Type the announcement details here..."
                            value={newMsg.content}
                            onChange={e => setNewMsg({...newMsg, content: e.target.value})}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={publishing} className="px-6 py-2 bg-primary text-primary-foreground rounded font-bold text-sm disabled:opacity-50">{publishing ? 'Publishing...' : 'Publish Now'}</button>
                    </div>
                </form>
            )}

            <div className="grid gap-6">
                {loading && <p className="text-center py-12 text-muted-foreground">Loading notices...</p>}
                {!loading && announcements.map(ann => (
                    <div key={ann.id} className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="flex gap-1">
                                        {!ann.target_roles || ann.target_roles.length === 0 ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-700">Public</span>
                                        ) : (
                                            ann.target_roles.map(r => (
                                                <span key={r} className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-700">{r}</span>
                                            ))
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : 'Draft'}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900">{ann.title}</h4>
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{ann.content}</p>
                    </div>
                ))}
                {!loading && !error && announcements.length === 0 && <p className="py-12 text-center text-muted-foreground">No announcements have been posted yet.</p>}
            </div>
        </div>
    );
}
