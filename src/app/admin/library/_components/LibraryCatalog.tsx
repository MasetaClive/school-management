'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage, requestJson } from '@/lib/api-client';

type Book = {
    id: string;
    title: string;
    author: string;
    available_quantity: number;
    quantity: number;
    category: string;
};

export default function LibraryCatalog() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newBook, setNewBook] = useState({ title: '', author: '', quantity: 1, category: '' });

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const data = await requestJson<unknown>('/api/admin/library/books');
            if (!Array.isArray(data)) throw new Error('The library catalog response was invalid.');
            setBooks(data);
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to load the book catalog. Please try again.'));
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            await requestJson('/api/admin/library/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBook),
            });
            setShowAdd(false);
            await load();
        } catch (error) {
            setError(getErrorMessage(error, 'Unable to add the book. Please try again.'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Book Inventory</h3>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                >
                    {showAdd ? 'Cancel' : 'Add New Book'}
                </button>
            </div>

            {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            {showAdd && (
                <form onSubmit={handleAdd} className="p-6 border rounded-lg bg-muted/20 grid grid-cols-4 gap-4 items-end">
                    <div className="col-span-2 space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                        <input 
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="e.g. Introduction to Physics"
                            value={newBook.title}
                            onChange={e => setNewBook({...newBook, title: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Author</label>
                        <input 
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="e.g. Albert Einstein"
                            value={newBook.author}
                            onChange={e => setNewBook({...newBook, author: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Quantity</label>
                        <input 
                            type="number"
                            className="w-full border p-2 rounded text-sm" 
                            value={newBook.quantity}
                            onChange={e => setNewBook({...newBook, quantity: Number(e.target.value)})}
                            required
                        />
                    </div>
                    <button type="submit" disabled={saving} className="col-start-4 bg-primary text-primary-foreground h-[40px] rounded font-bold text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Book'}</button>
                </form>
            )}

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Title & Author</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Category</th>
                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Available</th>
                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && <tr><td colSpan={4} className="p-12 text-center">Loading catalog...</td></tr>}
                        {!loading && books.map(book => (
                            <tr key={book.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4">
                                    <p className="font-bold">{book.title}</p>
                                    <p className="text-xs text-muted-foreground">{book.author}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-bold uppercase">
                                        {book.category || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`font-mono font-bold ${book.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {book.available_quantity} / {book.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary hover:underline font-medium">Issue to Student</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && !error && books.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No books have been added yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
