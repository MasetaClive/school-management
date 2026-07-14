'use client';

import { useState } from 'react';
import LibraryCatalog from './_components/LibraryCatalog';
import BorrowRecords from './_components/BorrowRecords';

export default function AdminLibraryPage() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'records'>('catalog');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight text-primary">Library Management</h2>
                <div className="flex bg-muted p-1 rounded-lg border border-muted-foreground/10">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'catalog' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Book Catalog
                    </button>
                    <button
                        onClick={() => setActiveTab('records')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'records' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Borrow History
                    </button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-lg min-h-[600px] overflow-hidden">
                {activeTab === 'catalog' ? <LibraryCatalog /> : <BorrowRecords />}
            </div>
        </div>
    );
}
