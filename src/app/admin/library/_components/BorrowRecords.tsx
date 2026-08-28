'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage, requestJson } from '@/lib/api-client';

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
    const [error, setError] = useState<string | null>(null);
    const [returningId, setReturningId] = useState<string | null>(null);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const data = await requestJson<unknown>('/api/admin/library/borrow');
            if (!Array.isArray(data)) throw new Error('The borrow records response was invalid.');
            setRecords(data);
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to load borrowing history. Please try again.'));
        } finally {
            setLoading(false);
        }
    }

    async function handleReturn(id: string) {
        if (!confirm('Mark this book as returned?')) return;
        try {
            setReturningId(id);
            setError(null);
            await requestJson(`/api/admin/library/return/${id}`, { method: 'PATCH' });
            await load();
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to return the book. Please try again.'));
        } finally {
            setReturningId(null);
        }
    }

    return (
        <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold">Borrowing History</h3>
            {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

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
                                            disabled={returningId === rec.id}
                                            className="text-primary hover:underline font-bold disabled:opacity-50"
                                        >
                                            {returningId === rec.id ? 'Returning...' : 'Return Book'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && !error && records.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No borrowing records found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
