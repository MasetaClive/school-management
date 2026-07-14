'use client';

import { useEffect, useState } from 'react';

type Profile = {
    full_name: string;
    email: string;
    student_id: string;
    enrollment_number: string;
    date_of_birth: string;
    gender: string;
    blood_group: string | null;
    phone: string | null;
    address: string | null;
    class: { name: string; grade_level: string };
};

type UserMetadata = {
    email_notifications?: boolean;
    sms_notifications?: boolean;
};

export default function StudentSettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userMetadata, setUserMetadata] = useState<UserMetadata>({});
    const [loading, setLoading] = useState(true);

    // Modal Visibility States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    // Form Action States
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    // Notifications Action States
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/student/dashboard');
                const json = await res.json();
                if (res.ok) {
                    setProfile(json.profile);
                    setUserMetadata(json.user_metadata || {});
                    setEmailAlerts(json.user_metadata?.email_notifications !== false);
                    setSmsAlerts(!!json.user_metadata?.sms_notifications);
                }
            } catch (e) {
                console.error('Failed to load profile', e);
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch('/api/student/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to update password');
            }

            setPasswordSuccess('Password changed successfully! Keep it safe.');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(null);
            }, 2000);
        } catch (err: any) {
            setPasswordError(err.message || 'Something went wrong.');
        } finally {
            setPasswordLoading(false);
        }
    }

    async function handleNotificationSubmit(e: React.FormEvent) {
        e.preventDefault();
        setNotificationSuccess(null);
        setNotificationLoading(true);

        try {
            const res = await fetch('/api/student/settings/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_notifications: emailAlerts,
                    sms_notifications: smsAlerts
                })
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to update preferences');
            }

            setNotificationSuccess('Notification preferences updated successfully!');
            setUserMetadata(json.user_metadata || {});
            setTimeout(() => {
                setShowNotificationModal(false);
                setNotificationSuccess(null);
            }, 2000);
        } catch (err: any) {
            alert(err.message || 'Something went wrong.');
        } finally {
            setNotificationLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
                        Identity Management
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        Account <span className="text-indigo-600">Settings</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Review your institutional profile and security preferences
                    </p>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500">
                        <div className="w-24 h-24 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-3xl font-black text-indigo-600 mx-auto mb-6 shadow-inner">
                            {profile?.full_name?.charAt(0)}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{profile?.full_name}</h2>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Student Scholar</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Student ID</span>
                                <span className="text-slate-900">{profile?.student_id}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Enrollment</span>
                                <span className="text-slate-900">{profile?.enrollment_number || 'STU-' + profile?.student_id}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Class</span>
                                <span className="text-slate-900">{profile?.class?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Personal Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">{profile?.full_name}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">{profile?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">{profile?.phone || 'Not provided'}</p>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</label>
                                <p className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">{profile?.address || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Security & Preferences</h3>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => {
                                    setPasswordError(null);
                                    setPasswordSuccess(null);
                                    setShowPasswordModal(true);
                                }}
                                className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group text-left cursor-pointer"
                            >
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic">Change Password</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update your authentication credentials</p>
                                </div>
                                <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setNotificationSuccess(null);
                                    setShowNotificationModal(true);
                                }}
                                className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group text-left cursor-pointer"
                            >
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic">Notification Settings</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage how you receive alerts and updates</p>
                                </div>
                                <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Glassmorphic Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in scale-in duration-300">
                        <button 
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
                        >
                            ✕
                        </button>
                        <div className="space-y-2 mb-6">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic">Change <span className="text-indigo-600">Password</span></h3>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Set a strong credentials key below</p>
                        </div>

                        {passwordError && (
                            <div className="p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-bold uppercase tracking-wider text-center">
                                ⚠️ {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="p-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold uppercase tracking-wider text-center">
                                ⚡ {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">New Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="••••••" 
                                    className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Confirm Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="••••••" 
                                    className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={passwordLoading}
                                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg disabled:opacity-40"
                            >
                                {passwordLoading ? 'Saving Credentials...' : 'Update Password →'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Settings Glassmorphic Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in scale-in duration-300">
                        <button 
                            onClick={() => setShowNotificationModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
                        >
                            ✕
                        </button>
                        <div className="space-y-2 mb-6">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic">Notification <span className="text-indigo-600">Settings</span></h3>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Configure your real-time updates channels</p>
                        </div>

                        {notificationSuccess && (
                            <div className="p-4 mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold uppercase tracking-wider text-center animate-in fade-in">
                                ⚡ {notificationSuccess}
                            </div>
                        )}

                        <form onSubmit={handleNotificationSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-900">Email Alerts</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Receive exam marks and report cards via email</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                        checked={emailAlerts}
                                        onChange={e => setEmailAlerts(e.target.checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-900">SMS Broadcasts</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Get urgent announcements and school closures on phone</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                        checked={smsAlerts}
                                        onChange={e => setSmsAlerts(e.target.checked)}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={notificationLoading}
                                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg disabled:opacity-40"
                            >
                                {notificationLoading ? 'Saving Preferences...' : 'Save Settings →'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
