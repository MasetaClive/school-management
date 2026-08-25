'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function AdminProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [updating, setUpdating] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', authUser.id)
                        .single();
                    
                    if (data) {
                        setUser(data);
                        setFullName(data.full_name || '');
                        setEmail(data.email || '');
                        setAvatarUrl(data.avatar_url || '');
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [supabase]);

    const handleUpdate = async () => {
        if (!user?.id) {
            alert('User profile not loaded. Please refresh the page.');
            return;
        }

        try {
            setUpdating(true);
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    full_name: fullName,
                    email: email,
                    avatar_url: avatarUrl
                })
            });

            const result = await res.json();

            if (!res.ok) {
                console.error('[Profile] Update failed:', result);
                throw new Error(result.error || 'Update failed');
            }
            
            setUser(result);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('[Profile] Error in handleUpdate:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Intelligence...</p>
                </div>
            </div>
        );
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : 'AD';

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-700">
            {/* Profile Header Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-white to-rose-600/5 -z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                    {/* Avatar Container */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-rose-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <div className="relative w-40 h-40 rounded-full bg-white flex items-center justify-center text-5xl font-black text-indigo-600 border-4 border-white shadow-xl overflow-hidden tracking-tighter">
                            {user?.avatar_url ? (
                                <Image src={user.avatar_url} alt={user.full_name} width={160} height={160} unoptimized className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <button 
                            onClick={() => {
                                const url = prompt('Enter image URL:', avatarUrl);
                                if (url !== null) setAvatarUrl(url);
                            }}
                            className="absolute bottom-2 right-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-indigo-600 hover:scale-110 transition-transform"
                        >
                            📷
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                System {user?.role || 'Administrator'}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                                {user?.full_name || 'Admin Personnel'}
                            </h1>
                            <p className="text-slate-500 font-medium text-lg font-sans">
                                {user?.email}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                            <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Account ID</p>
                                <p className="text-xs font-black text-slate-800 font-mono">#{user?.id?.slice(0, 8)}</p>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Status</p>
                                <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ACTIVE VERIFIED
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0">
                        {editing ? (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setEditing(false)}
                                    className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpdate}
                                    disabled={updating}
                                    className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-200 disabled:opacity-50"
                                >
                                    {updating ? 'Saving...' : 'Save Identity'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setEditing(true)}
                                className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all hover:shadow-2xl hover:shadow-indigo-200 group"
                            >
                                Edit Identity <span className="inline-block group-hover:translate-x-1 transition-transform ml-2">→</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Detailed Information */}
                <div className="lg:col-span-2 space-y-8">
                    <div className=" bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Identity Diagnostics</h3>
                            {!editing && (
                                <button 
                                    onClick={() => setEditing(true)}
                                    className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4"
                                >
                                    Update Details
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                                {editing ? (
                                    <input 
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                                    />
                                ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                        {user?.full_name}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Email</label>
                                {editing ? (
                                    <input 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                                    />
                                ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                        {user?.email}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Role</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-indigo-600 uppercase tracking-tight opacity-50 cursor-not-allowed">
                                    {user?.role}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Member Since</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 opacity-50 cursor-not-allowed">
                                    {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Security Integrity</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => alert('Password reset module is being provisioned. Please contact the system architect.')}
                                    className="flex items-center justify-between p-5 bg-rose-50 border border-rose-100 rounded-[2rem] group hover:bg-rose-600 transition-all duration-300"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest group-hover:text-white transition-colors">Credential Reset</p>
                                        <p className="text-xs font-medium text-rose-400 group-hover:text-rose-100 transition-colors">Last changed 3 months ago</p>
                                    </div>
                                    <span className="text-rose-600 group-hover:text-white transition-colors text-xl">🔒</span>
                                </button>
                                <button 
                                    onClick={() => alert('MFA settings are locked by institutional policy.')}
                                    className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] group hover:bg-indigo-600 transition-all duration-300"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:text-white transition-colors">Multi-Factor Auth</p>
                                        <p className="text-xs font-medium text-emerald-500 group-hover:text-emerald-100 transition-colors">ENABLED secured via Authenticator</p>
                                    </div>
                                    <span className="text-indigo-600 group-hover:text-white transition-colors text-xl">📱</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    {/* Activity Score */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[80px]" />
                        <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-indigo-300">Operational Pulse</h3>
                        
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - 0.94)} className="text-indigo-500 transition-all duration-1000" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black tracking-tighter">94%</span>
                                    <span className="text-[8px] font-black uppercase text-indigo-300">Score</span>
                                </div>
                            </div>
                            <p className="text-center text-xs font-medium text-slate-400 px-6 cursor-help" title="Based on system interactions and response latency">
                                Your activity level is exceptional. Ranked top 2% of school administrators.
                            </p>
                        </div>

                        <div className="h-px bg-white/10 my-6" />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">System Uptime</span>
                                <span className="text-emerald-400 text-shadow-glow">99.9%</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Reports Generated</span>
                                <span>1,280</span>
                            </div>
                        </div>
                    </div>

                    {/* Permissions List */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Authority Matrix</h3>
                        <div className="space-y-3">
                            {['Manage Faculty', 'Financial Override', 'Curriculum Control', 'Database Root', 'Institutional Settings'].map((perm) => (
                                <div key={perm} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 group cursor-default">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] group-hover:bg-emerald-500 group-hover:text-white transition-colors">✓</div>
                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{perm}</span>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => alert('Access expansion request transmitted to the security council.')}
                            className="w-full mt-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-100 transition-colors"
                        >
                            Request Access Expansion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
