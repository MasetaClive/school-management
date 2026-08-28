'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage, requestJson } from '@/lib/api-client';

type FeeType = { id: string; name: string; amount: number; academic_year: string };

export default function FeesManagement() {
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newFee, setNewFee] = useState({ name: '', amount: 0, academic_year: '2023-2024' });

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const data = await requestJson<unknown>('/api/admin/fees/types');
            if (!Array.isArray(data)) throw new Error('The fee types response was invalid.');
            setFeeTypes(data);
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to load fee types. Please try again.'));
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            await requestJson('/api/admin/fees/types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFee),
            });
            setShowCreate(false);
            await load();
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to create the fee type. Please try again.'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Fee Structures</h3>
                <button 
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                >
                    {showCreate ? 'Cancel' : 'Create Fee Type'}
                </button>
            </div>

            {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            {showCreate && (
                <form onSubmit={handleCreate} className="p-6 border rounded-lg bg-muted/20 grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                        <input 
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="e.g. Tuition Fee"
                            value={newFee.name}
                            onChange={e => setNewFee({...newFee, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Amount</label>
                        <input 
                            type="number"
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="1000.00"
                            value={newFee.amount}
                            onChange={e => setNewFee({...newFee, amount: Number(e.target.value)})}
                            required
                        />
                    </div>
                    <button type="submit" disabled={saving} className="bg-primary text-primary-foreground h-[40px] rounded font-bold text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Fee Type'}</button>
                </form>
            )}

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Fee Name</th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Academic Year</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Standard Amount</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && <tr><td colSpan={4} className="p-12 text-center">Loading fee types...</td></tr>}
                        {!loading && feeTypes.map(ft => (
                            <tr key={ft.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-bold">{ft.name}</td>
                                <td className="px-6 py-4 text-muted-foreground">{ft.academic_year}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">${ft.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary hover:underline font-medium">Assign Students</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && !error && feeTypes.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No fee types have been created yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
