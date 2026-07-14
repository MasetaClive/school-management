'use client';

import { useEffect, useState } from 'react';

type InventoryItem = {
    id: string;
    name: string;
    category: string;
    total_quantity: number;
    available_quantity: number;
    condition: string;
    location: string;
};

export default function InventoryManagement() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', category: 'furniture', total_quantity: 1, location: '' });

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/inventory/items');
            const data = await res.json();
            setItems(data);
        } catch (e) {
            console.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/inventory/items', {
                method: 'POST',
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                setShowAdd(false);
                void load();
            }
        } catch (e) {
            alert('Failed to add item');
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">School Inventory</h3>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 bg-black text-white rounded-md text-sm font-bold"
                >
                    {showAdd ? 'Cancel' : 'Register New Asset'}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="p-6 border rounded-lg bg-muted/20 grid grid-cols-4 gap-4 items-end">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Item Name</label>
                        <input 
                            className="w-full border p-2 rounded text-sm" 
                            placeholder="e.g. Smart Board Projector"
                            value={newItem.name}
                            onChange={e => setNewItem({...newItem, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Category</label>
                        <select 
                            className="w-full border p-2 rounded text-sm"
                            value={newItem.category}
                            onChange={e => setNewItem({...newItem, category: e.target.value})}
                        >
                            <option value="furniture">Furniture</option>
                            <option value="electronics">Electronics</option>
                            <option value="stationary">Stationary</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-primary text-primary-foreground h-[40px] rounded font-bold text-sm">Save Asset</button>
                </form>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {items.map(item => (
                    <div key={item.id} className="p-4 border rounded-xl bg-card shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-black uppercase tracking-tighter">{item.category}</span>
                            <span className={`text-[10px] font-black uppercase ${
                                item.condition === 'good' ? 'text-green-600' : 'text-yellow-600'
                            }`}>{item.condition}</span>
                        </div>
                        <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.location || 'Not Set'}</span>
                            <span className="font-mono font-bold text-xs">{item.available_quantity} / {item.total_quantity}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button className="text-[10px] font-bold py-1 border rounded hover:bg-muted">Check Out</button>
                            <button className="text-[10px] font-bold py-1 border rounded hover:bg-muted">Maintenance</button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-muted-foreground text-xs italic">No assets registered yet.</div>
                )}
            </div>
        </div>
    );
}
