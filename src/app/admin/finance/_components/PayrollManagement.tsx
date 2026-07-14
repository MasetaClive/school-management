'use client';

import { useEffect, useState } from 'react';

type PayrollRecord = {
    id: string;
    month: number;
    year: number;
    net_amount: number;
    status: string;
    teacher: { full_name: string; teacher_id: string };
};

export default function PayrollManagement() {
    const [history, setHistory] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/payroll');
            const data = await res.json();
            setHistory(data);
        } catch (e) {
            console.error('Failed to load payroll');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        if (!confirm(`Generate payroll for ${month}/${year}?`)) return;

        try {
            setGenerating(true);
            const res = await fetch('/api/admin/payroll', {
                method: 'POST',
                body: JSON.stringify({ month, year })
            });
            if (res.ok) {
                void load();
            } else {
                const json = await res.json();
                alert(json.error || 'Failed to generate');
            }
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold">Payroll History</h3>
                    <p className="text-sm text-muted-foreground">Manage monthly salary disbursements</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">Configure Salaries</button>
                    <button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-black text-white rounded-md text-sm font-bold disabled:opacity-50"
                    >
                        {generating ? 'Processing...' : 'Run Monthly Payroll'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Staff Member</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Period</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Net Pay</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && <tr><td colSpan={5} className="p-12 text-center">Loading payroll...</td></tr>}
                        {!loading && history.map(rec => (
                            <tr key={rec.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4">
                                    <p className="font-bold">{rec.teacher.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{rec.teacher.teacher_id}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-medium">{new Date(rec.year, rec.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-green-600">${rec.net_amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                        rec.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary hover:underline font-medium">View Payslip</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && history.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No payroll records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
