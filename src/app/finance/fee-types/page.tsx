'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeeType {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    amount: number;
    currency: string;
    billingFrequency: 'Once' | 'Monthly' | 'Termly' | 'Semester' | 'Yearly';
    mandatory: boolean;
    active: boolean;
}

const defaultFeeTypes: FeeType[] = [
    {
        id: '1',
        name: 'Tuition Fee - Grade 10',
        code: 'TUI-GR10',
        category: 'Tuition',
        description: 'Standard tuition fee for Grade 10 students.',
        amount: 1500,
        currency: 'USD',
        billingFrequency: 'Termly',
        mandatory: true,
        active: true,
    },
    {
        id: '2',
        name: 'Bus Transport - Route A',
        code: 'BUS-RTA',
        category: 'Transport',
        description: 'Daily transport services for Route A.',
        amount: 300,
        currency: 'USD',
        billingFrequency: 'Monthly',
        mandatory: false,
        active: true,
    },
    {
        id: '3',
        name: 'Science Lab Material Fee',
        code: 'LAB-SCI',
        category: 'Facility',
        description: 'Laboratory chemicals and equipment usage fee.',
        amount: 150,
        currency: 'USD',
        billingFrequency: 'Once',
        mandatory: true,
        active: false,
    },
    {
        id: '4',
        name: 'Annual Sports Kit',
        code: 'SPT-KIT',
        category: 'Uniforms',
        description: 'Physical education tracksuits and sportswear kit.',
        amount: 120,
        currency: 'USD',
        billingFrequency: 'Yearly',
        mandatory: false,
        active: true,
    },
    {
        id: '5',
        name: 'Semester Assessment Exams',
        code: 'EXM-SEM',
        category: 'Exam',
        description: 'Midterm and final semester examinations processing fee.',
        amount: 250,
        currency: 'USD',
        billingFrequency: 'Semester',
        mandatory: true,
        active: true,
    }
];

export default function FeeTypesListPage() {
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedFrequency, setSelectedFrequency] = useState('All');
    const [selectedMandatory, setSelectedMandatory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // Load data from localStorage or seed with defaults
    useEffect(() => {
        const stored = localStorage.getItem('antigravity_fee_types');
        if (stored) {
            try {
                setFeeTypes(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing stored fee types:', e);
                setFeeTypes(defaultFeeTypes);
                localStorage.setItem('antigravity_fee_types', JSON.stringify(defaultFeeTypes));
            }
        } else {
            setFeeTypes(defaultFeeTypes);
            localStorage.setItem('antigravity_fee_types', JSON.stringify(defaultFeeTypes));
        }
    }, []);

    // Save to localStorage helper
    const saveToLocalStorage = (updatedList: FeeType[]) => {
        setFeeTypes(updatedList);
        localStorage.setItem('antigravity_fee_types', JSON.stringify(updatedList));
    };

    // Toggle Active/Inactive state inline
    const handleToggleActive = (id: string) => {
        const updated = feeTypes.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
        );
        saveToLocalStorage(updated);
    };

    // Delete a Fee Type
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this fee type? This action cannot be undone.')) {
            const updated = feeTypes.filter(item => item.id !== id);
            saveToLocalStorage(updated);
        }
    };

    // Filter categories & frequencies dynamically for dropdown suggestions
    const categories = ['All', ...Array.from(new Set(feeTypes.map(f => f.category)))];
    const frequencies = ['All', 'Once', 'Monthly', 'Termly', 'Semester', 'Yearly'];

    // Filter Logic
    const filteredFeeTypes = feeTypes.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.code.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesFrequency = selectedFrequency === 'All' || item.billingFrequency === selectedFrequency;
        
        const matchesMandatory = 
            selectedMandatory === 'All' || 
            (selectedMandatory === 'Yes' && item.mandatory) || 
            (selectedMandatory === 'No' && !item.mandatory);
            
        const matchesStatus = 
            selectedStatus === 'All' || 
            (selectedStatus === 'Active' && item.active) || 
            (selectedStatus === 'Inactive' && !item.active);

        return matchesSearch && matchesCategory && matchesFrequency && matchesMandatory && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Fee Types</h2>
                    <p className="text-slate-500 font-medium">Manage and define academic fee structures and categories.</p>
                </div>
                <Link 
                    href="/finance/fee-types/create"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/50 transition-all cursor-pointer shadow-md shadow-emerald-100"
                >
                    <span className="text-sm font-bold">+</span> Create Fee Type
                </Link>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search query */}
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input 
                                type="text"
                                placeholder="Name or Code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Category</label>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Billing Frequency Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Frequency</label>
                        <select 
                            value={selectedFrequency}
                            onChange={(e) => setSelectedFrequency(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            {frequencies.map(freq => (
                                <option key={freq} value={freq}>{freq === 'All' ? 'All Frequencies' : freq}</option>
                            ))}
                        </select>
                    </div>

                    {/* Mandatory Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Requirement</label>
                        <select 
                            value={selectedMandatory}
                            onChange={(e) => setSelectedMandatory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            <option value="All">All Billing Types</option>
                            <option value="Yes">Mandatory Only</option>
                            <option value="No">Optional Only</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Status</label>
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Fee Types Table Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto border border-slate-50 rounded-2xl p-4">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Name & Description</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Frequency</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Mandatory</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Active Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredFeeTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400 font-medium italic">
                                        No fee types found matching the current search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredFeeTypes.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-xs">{item.description || 'No description provided.'}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-500">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                                {item.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-slate-800 text-sm">
                                            {item.currency === 'USD' ? '$' : item.currency + ' '}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wide">
                                            {item.billingFrequency}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.mandatory ? (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500">
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleToggleActive(item.id)}
                                                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.active ? 'bg-emerald-600' : 'bg-slate-200'}`}
                                                title={item.active ? 'Deactivate Fee Type' : 'Activate Fee Type'}
                                            >
                                                <span 
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.active ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Link 
                                                    href={`/finance/fee-types/${item.id}/edit`}
                                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-black uppercase tracking-widest text-[9px] rounded-lg text-slate-500 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 font-black uppercase tracking-widest text-[9px] rounded-lg text-slate-500 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
