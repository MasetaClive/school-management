'use client';

import { useEffect, useState } from 'react';

type Setting = { id: string; key: string; value: any };

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSettings(data);
            } else {
                setSettings([]);
                console.error('API Error: Expected array but received', data);
            }
        } catch (e) {
            console.error('Failed to load settings');
            setSettings([]);
        } finally {
            setLoading(false);
        }
    }

    const updateValue = (key: string, field: string, val: string) => {
        setSettings(prev => prev.map(s => {
            if (s.key === key) {
                return { ...s, value: { ...s.value, [field]: val } };
            }
            return s;
        }));
    };

    const handleSave = async (key: string, value: any) => {
        try {
            setSaving(true);
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ key, value })
            });
            if (res.ok) alert('Settings updated');
        } catch (e) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const schoolInfo = settings.find(s => s.key === 'school_info')?.value;
    const academicConfig = settings.find(s => s.key === 'academic_config')?.value;

    return (
        <div className="max-w-4xl space-y-8">
            <h2 className="text-3xl font-black tracking-tight text-primary">System Settings</h2>

            {loading ? (
                <p>Loading configuration...</p>
            ) : (
                <>
                    {/* School Information */}
                    <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="text-2xl">🏫</span> School Profile
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">School Name</label>
                                <input 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={schoolInfo?.name || ''}
                                    onChange={e => updateValue('school_info', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Contact Phone</label>
                                <input 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={schoolInfo?.phone || ''}
                                    onChange={e => updateValue('school_info', 'phone', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Address</label>
                                <input 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={schoolInfo?.address || ''}
                                    onChange={e => updateValue('school_info', 'address', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => handleSave('school_info', schoolInfo)}
                                disabled={saving}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm"
                            >
                                Save Profile
                            </button>
                        </div>
                    </div>

                    {/* Academic Configuration */}
                    <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="text-2xl">📅</span> Academic Calendar
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Current Academic Year</label>
                                <input 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={academicConfig?.current_year || ''}
                                    placeholder="e.g. 2023-2024"
                                    onChange={e => updateValue('academic_config', 'current_year', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Current Term</label>
                                <input 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={academicConfig?.current_term || ''}
                                    placeholder="e.g. Term 1"
                                    onChange={e => updateValue('academic_config', 'current_term', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => handleSave('academic_config', academicConfig)}
                                disabled={saving}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm"
                            >
                                Update Calendar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
