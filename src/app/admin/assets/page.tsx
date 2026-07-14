'use client';

import { useState } from 'react';
import TransportManagement from './_components/TransportManagement';
import InventoryManagement from './_components/InventoryManagement';

export default function AdminAssetsPage() {
    const [activeTab, setActiveTab] = useState<'transport' | 'inventory'>('transport');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight text-primary">Assets & Logistics</h2>
                <div className="flex bg-muted p-1 rounded-lg border border-muted-foreground/10">
                    <button
                        onClick={() => setActiveTab('transport')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'transport' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Transport
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'inventory' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Inventory
                    </button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-lg min-h-[600px] overflow-hidden">
                {activeTab === 'transport' ? <TransportManagement /> : <InventoryManagement />}
            </div>
        </div>
    );
}
