'use client';

import { useState } from 'react';
import FeesManagement from './_components/FeesManagement';
import PayrollManagement from './_components/PayrollManagement';

export default function AdminFinancePage() {
    const [activeTab, setActiveTab] = useState<'fees' | 'payroll'>('fees');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight">Financial Management</h2>
                <div className="flex bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('fees')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'fees' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Student Fees
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'payroll' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Staff Payroll
                    </button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm min-h-[600px]">
                {activeTab === 'fees' ? <FeesManagement /> : <PayrollManagement />}
            </div>
        </div>
    );
}
