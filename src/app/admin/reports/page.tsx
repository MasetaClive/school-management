'use client';

import { useEffect, useState } from 'react';

type AcademicStat = { name: string; average: number };
type FinanceStat = { collections: number; expenses: number; net: number };

export default function AdminReportsPage() {
    const [academic, setAcademic] = useState<AcademicStat[]>([]);
    const [finance, setFinance] = useState<FinanceStat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const [aRes, fRes] = await Promise.all([
                fetch('/api/admin/reports/academic'),
                fetch('/api/admin/reports/financial')
            ]);
            setAcademic(await aRes.json());
            setFinance(await fRes.json());
        } catch (e) {
            console.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight text-primary">School Analytics</h2>

            {loading ? (
                <p>Generating reports...</p>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Financial Overview */}
                    <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-6">
                        <h3 className="text-lg font-bold">Financial Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <p className="text-[10px] font-black uppercase text-green-700">Total Collections</p>
                                <p className="text-2xl font-black text-green-900">${finance?.collections.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-[10px] font-black uppercase text-red-700">Total Expenses</p>
                                <p className="text-2xl font-black text-red-900">${finance?.expenses.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-900 rounded-xl text-white">
                            <p className="text-[10px] font-black uppercase opacity-60">Net Balance</p>
                            <p className="text-3xl font-black">${finance?.net.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Academic Performance */}
                    <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-6">
                        <h3 className="text-lg font-bold">Academic Performance (Averages)</h3>
                        <div className="space-y-4">
                            {academic.map(stat => (
                                <div key={stat.name} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>{stat.name}</span>
                                        <span>{stat.average}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-primary h-full transition-all duration-1000" 
                                            style={{ width: `${stat.average}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {academic.length === 0 && <p className="text-sm text-muted-foreground italic">No exam data available for analysis.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
