'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type TeacherProfile = {
    id: string;
    teacher_id: string;
    full_name: string;
    email: string;
    phone: string;
    qualification: string;
    hire_date: string;
};

type AssignedClass = {
    id: string;
    name: string;
    academic_year: string;
};

export default function TeacherProfilePage() {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfileData() {
            try {
                const [profRes, classRes] = await Promise.all([
                    fetch('/api/teacher/profile'),
                    fetch('/api/teacher/classes')
                ]);

                if (!profRes.ok) throw new Error('Failed to load profile details');
                if (!classRes.ok) throw new Error('Failed to load assigned classes');

                const profData = await profRes.json();
                const classData = await classRes.json();

                setProfile(profData.teacher);
                setClasses(classData.data || []);
            } catch (err: any) {
                console.error('[Profile] Error loading data', err);
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        }
        void loadProfileData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Identity...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-2xl mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Failed to Load Profile</p>
                <p className="text-red-600 text-sm mb-6">{error || 'Teacher profile record not found.'}</p>
                <Link href="/teacher/dashboard" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all shadow-md">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const initials = profile.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : 'TR';

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-700 max-w-6xl mx-auto">
            {/* Profile Header Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-white to-emerald-600/5 -z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-full blur opacity-25" />
                        <div className="relative w-36 h-36 rounded-full bg-white flex items-center justify-center text-4xl font-black text-indigo-600 border-4 border-white shadow-xl overflow-hidden tracking-tighter">
                            {initials}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
                                Faculty Member
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                                {profile.full_name}
                            </h1>
                            <p className="text-slate-500 font-medium text-lg font-sans">
                                {profile.email || 'No email provided'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                            <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Teacher ID</p>
                                <p className="text-xs font-black text-slate-800 font-mono">#{profile.teacher_id}</p>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Status</p>
                                <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ACTIVE STAFF
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Details Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Institutional Credentials</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.full_name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Teacher ID</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.teacher_id}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Qualifications</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.qualification || 'Not specified'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date of Hire</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Phone</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.phone || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                                    {profile.email || 'Not provided'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Classes Card */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Assigned Classes</h3>
                        
                        {classes.length === 0 ? (
                            <p className="text-sm text-slate-400 font-medium py-4 text-center">No assigned classes found.</p>
                        ) : (
                            <div className="space-y-3">
                                {classes.map((cls) => (
                                    <div key={cls.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 hover:bg-indigo-50/10 transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                                                🏫
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{cls.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{cls.academic_year}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
