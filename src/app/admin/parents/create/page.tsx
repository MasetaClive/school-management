'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateParentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        parent_id: '',
        full_name: '',
        phone: '',
        email: '',
        address: '',
        occupation: '',
        create_account: true,
        password_mode: 'auto' as 'auto' | 'manual',
        password: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...form,
                email: form.email || undefined,
                address: form.address || undefined,
                occupation: form.occupation || undefined,
                password: form.create_account && form.password_mode === 'manual' ? form.password : undefined,
            };

            const res = await fetch('/api/admin/parents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to create parent');

            if (json.account) {
                alert(`Account created.\nUsername: ${json.account.username}\nTemporary password: ${json.account.initialPassword}\nThe user must change this password on first sign-in.`);
            }

            router.push('/admin/parents');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create parent');
        } finally {
            setLoading(false);
        }
    }

    const inputClasses = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-sm focus:bg-white";
    const labelClasses = "text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block ml-1";

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin/parents" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline italic">← Return to Guardians</Link>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Register Guardian</h1>
                    <p className="text-slate-500 font-medium font-sans">Initialize familial and secure access records.</p>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Protocol Failure</p>
                        <p className="text-xs font-bold text-rose-500">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Identity & Contact */}
                <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100 text-white">👥</div>
                        <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Guardian Identity</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className={labelClasses}>Legal Full Name *</label>
                            <input
                                required
                                placeholder="e.g. Mary Jane"
                                className={inputClasses}
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Guardian Reference ID *</label>
                            <input
                                required
                                placeholder="e.g. PAR2024001"
                                className={inputClasses}
                                value={form.parent_id}
                                onChange={(e) => setForm({ ...form, parent_id: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Primary Phone *</label>
                            <input
                                required
                                placeholder="e.g. +1 234 567 890"
                                className={inputClasses}
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Personal Email</label>
                            <input
                                type="email"
                                placeholder="e.g. mary.j@gmail.com"
                                className={inputClasses}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Personal & Professional */}
                <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100 text-white">💼</div>
                        <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Bio & Locality</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className={labelClasses}>Occupation</label>
                            <input
                                placeholder="e.g. Software Architect"
                                className={inputClasses}
                                value={form.occupation}
                                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Residential Address</label>
                            <textarea
                                placeholder="Enter full primary residence"
                                className={inputClasses + " h-32 py-4 resize-none"}
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Security & Access Control */}
                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/50 text-white">🛡️</div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Security & Access</h3>
                        </div>
                        <label className="inline-flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={form.create_account}
                                onChange={(e) => setForm({ ...form, create_account: e.target.checked })}
                            />
                            <div className="relative w-14 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ms-3 text-xs font-black uppercase text-indigo-400 tracking-widest group-hover:text-indigo-300 transition-colors">Automate Account Creation</span>
                        </label>
                    </div>

                    {form.create_account && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                            <div className="space-y-4">
                                <label className={labelClasses + " text-slate-500"}>Assigned Login ID (Auto)</label>
                                <div className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-xs font-black text-indigo-400 italic">
                                    {form.email || form.parent_id || 'ENTER GUARDIAN ID OR EMAIL...'}
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Guardians use their ID or verified email for administrative access.
                                </p>
                            </div>
                            <div>
                                <label className={labelClasses + " text-slate-500"}>Password Setup</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={form.password_mode}
                                    onChange={(e) => setForm({ ...form, password_mode: e.target.value as 'auto' | 'manual' })}
                                >
                                    <option value="auto">Generate secure temporary password</option>
                                    <option value="manual">Enter a temporary password</option>
                                </select>
                                {form.password_mode === 'manual' && <>
                                <label className={labelClasses + " text-slate-500 mt-4"}>Initial Access Password *</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                                </>}
                                <p className="mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    The user will be required to change this password on first sign-in.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Area */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ensuring Guardian directory integrity & compliance.</p>
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-12 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-100 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? 'Processing...' : 'Authorize & Register Guardian'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
