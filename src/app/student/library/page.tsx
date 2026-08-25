'use client';

import { useCallback, useEffect, useState } from 'react';

type Book = {
    id: string;
    title: string;
    author: string;
    available_quantity: number;
    quantity: number;
    category: string;
};

export default function StudentLibraryPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [borrowingId, setBorrowingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/library/books${search ? `?q=${search}` : ''}`);
            const data = await res.json();
            setBooks(data || []);
        } catch (e) {
            console.error('Failed to load books');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        void load();
    }, [load]);

    async function handleBorrow(bookId: string, title: string) {
        setBorrowingId(bookId);
        setMessage(null);

        try {
            const res = await fetch('/api/student/library/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ book_id: bookId })
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to borrow book');
            }

            setMessage({ text: `Successfully borrowed "${title}"! Please collect it from the desk.`, type: 'success' });
            
            // Optimistic update of book quantities
            setBooks(prevBooks =>
                prevBooks.map(b =>
                    b.id === bookId ? { ...b, available_quantity: Math.max(0, b.available_quantity - 1) } : b
                )
            );
        } catch (error: any) {
            setMessage({ text: error.message || 'An unexpected error occurred.', type: 'error' });
        } finally {
            setBorrowingId(null);
        }
    }

    return (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-100">
                        Institutional Catalog
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
                        School <span className="text-amber-500">Library</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Expand your knowledge and borrow resources from the main academy archives
                    </p>
                </div>

                {/* Glassmorphic Search Bar */}
                <div className="relative w-full md:w-80">
                    <input 
                        type="text" 
                        placeholder="Search titles or authors..." 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold uppercase tracking-wide placeholder:text-slate-300"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        suppressHydrationWarning
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                </div>
            </header>

            <div className="h-px bg-slate-100 w-full" />

            {/* Status Alert Overlay */}
            {message && (
                <div className={`p-6 rounded-[2rem] border text-center transition-all duration-500 animate-in fade-in ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                    <p className="font-black uppercase tracking-widest text-xs mb-1">
                        {message.type === 'success' ? '⚡ System Access Granted' : '⚠️ Request Blocked'}
                    </p>
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Catalogue...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {books.map((book) => {
                        const isAvailable = book.available_quantity > 0;
                        return (
                            <div 
                                key={book.id} 
                                className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
                            >
                                {/* Category and Availability Badge */}
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[8px] font-black uppercase tracking-widest">
                                        {book.category || 'General'}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                        isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>
                                        {isAvailable ? 'Available' : 'Out of Stock'}
                                    </span>
                                </div>

                                {/* Title and Author */}
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-amber-500 transition-colors uppercase italic tracking-tight leading-snug">
                                    {book.title}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                                    By {book.author || 'Unknown Scholar'}
                                </p>

                                {/* Footer & Borrow Actions */}
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">In Inventory</p>
                                        <p className="text-sm font-black text-slate-900 mt-1 tabular-nums">
                                            {book.available_quantity} <span className="text-slate-300 font-normal">/ {book.quantity || 1}</span>
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => handleBorrow(book.id, book.title)}
                                        disabled={!isAvailable || borrowingId === book.id}
                                        className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] transition-all hover:bg-amber-500 shadow-xl shadow-slate-200 disabled:opacity-35 disabled:hover:bg-slate-900 disabled:shadow-none"
                                    >
                                        {borrowingId === book.id ? 'Borrowing...' : 'Borrow Book →'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {books.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/50">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                                📖
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">No Matching Resources</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-10">
                                The archives returned no books matching your current search parameters.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
