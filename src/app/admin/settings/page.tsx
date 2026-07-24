'use client';

import { useEffect, useState } from 'react';

type SchoolInfo = { name: string; address: string; phone: string };
type AcademicConfig = { current_year: string; current_term: 'Term 1' | 'Term 2' | 'Term 3' };

export default function AdminSettingsPage() {
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ name: '', address: '', phone: '' });
    const [academicConfig, setAcademicConfig] = useState<AcademicConfig>({ current_year: '', current_term: 'Term 1' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<'school_info' | 'academic_config' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => { void load(); }, []);
    async function load() {
        try {
            setError(null);
            const response = await fetch('/api/admin/settings');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? 'Failed to load settings');
            const school = data.find((item: { key: string }) => item.key === 'school_info')?.value;
            const academic = data.find((item: { key: string }) => item.key === 'academic_config')?.value;
            if (school) setSchoolInfo({ name: school.name ?? '', address: school.address ?? '', phone: school.phone ?? '' });
            if (academic) setAcademicConfig({ current_year: academic.current_year ?? '', current_term: academic.current_term ?? 'Term 1' });
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to load settings'); }
        finally { setLoading(false); }
    }
    async function save(key: 'school_info' | 'academic_config') {
        setSaving(key); setMessage(null); setError(null);
        try {
            const response = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value: key === 'school_info' ? schoolInfo : academicConfig }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? 'Failed to save settings');
            setMessage('Settings saved.');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to save settings'); }
        finally { setSaving(null); }
    }
    if (loading) return <p>Loading configuration...</p>;
    return <div className="max-w-4xl space-y-8"><h2 className="text-3xl font-black tracking-tight text-primary">System Settings</h2>{error && <p className="text-sm text-red-600">{error}</p>}{message && <p className="text-sm text-green-700">{message}</p>}
        <section className="p-8 border rounded-2xl bg-card shadow-sm space-y-6"><h3 className="text-lg font-bold">School Profile</h3><div className="grid grid-cols-2 gap-6"><label className="space-y-1 text-sm">School Name<input className="w-full border p-2 rounded-lg" value={schoolInfo.name} onChange={(event) => setSchoolInfo((value) => ({ ...value, name: event.target.value }))} /></label><label className="space-y-1 text-sm">Contact Phone<input className="w-full border p-2 rounded-lg" value={schoolInfo.phone} onChange={(event) => setSchoolInfo((value) => ({ ...value, phone: event.target.value }))} /></label><label className="col-span-2 space-y-1 text-sm">Address<input className="w-full border p-2 rounded-lg" value={schoolInfo.address} onChange={(event) => setSchoolInfo((value) => ({ ...value, address: event.target.value }))} /></label></div><div className="flex justify-end"><button onClick={() => void save('school_info')} disabled={saving !== null} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50">{saving === 'school_info' ? 'Saving...' : 'Save Profile'}</button></div></section>
        <section className="p-8 border rounded-2xl bg-card shadow-sm space-y-6"><h3 className="text-lg font-bold">Academic Calendar</h3><div className="grid grid-cols-2 gap-6"><label className="space-y-1 text-sm">Current Academic Year<input className="w-full border p-2 rounded-lg" value={academicConfig.current_year} onChange={(event) => setAcademicConfig((value) => ({ ...value, current_year: event.target.value }))} /></label><label className="space-y-1 text-sm">Current Term<select className="w-full border p-2 rounded-lg bg-background" value={academicConfig.current_term} onChange={(event) => setAcademicConfig((value) => ({ ...value, current_term: event.target.value as AcademicConfig['current_term'] }))}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></label></div><div className="flex justify-end"><button onClick={() => void save('academic_config')} disabled={saving !== null} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50">{saving === 'academic_config' ? 'Saving...' : 'Update Calendar'}</button></div></section></div>;
}
