'use client';

import { useEffect, useState } from 'react';

type BorrowRecord = {
    id: string;
    borrow_date: string;
    return_date: string | null;
    status: string;
    book: { title: string; author: string };
    student: { full_name: string; student_id: string };
};

export default function BorrowRecords() {
    const [records, setRecords] = useState<BorrowRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/library/borrow');
            const data = await res.json();
            setRecords(data);
        } catch (e) {
            console.error('Failed to load borrow records');
        } finally {
            setLoading(false);
        }
    }

    async function handleReturn(id: string) {
        if (!confirm('Mark this book as returned?')) return;
        try {
            const res = await fetch(`/api/admin/library/return/${id}`, { method: 'PATCH' });
            if (res.ok) void load();
        } catch (e) {
            alert('Failed to return book');
        }
    }

    return (
        <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold">Borrowing History</h3>

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Book</th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Student</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Dates</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && <tr><td colSpan={5} className="p-12 text-center">Loading records...</td></tr>}
                        {!loading && records.map(rec => (
                            <tr key={rec.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4">
                                    <p className="font-bold">{rec.book.title}</p>
                                    <p className="text-xs text-muted-foreground">{rec.book.author}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium">{rec.student.full_name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground">{rec.student.student_id}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <p className="text-xs font-medium">B: {new Date(rec.borrow_date).toLocaleDateString()}</p>
                                    {rec.return_date && <p className="text-xs text-green-600">R: {new Date(rec.return_date).toLocaleDateString()}</p>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        rec.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {rec.status === 'borrowed' && (
                                        <button 
                                            onClick={() => void handleReturn(rec.id)}
                                            className="text-primary hover:underline font-bold"
                                        >
                                            Return Book
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
