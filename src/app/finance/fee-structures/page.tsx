'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeeType {
    id: string;
    name: string;
    code: string;
    category: string;
    amount: number;
    active: boolean;
}

interface FeeStructure {
    id: string;
    name: string;
    academicYear: string;
    term: string;
    gradeClass: string;
    currency: string;
    active: boolean;
    isUsed: boolean;
    items: {
        feeTypeId: string;
        amount: number;
    }[];
}

const defaultFeeTypes: FeeType[] = [
    { id: '1', name: 'Tuition Fee - Grade 10', code: 'TUI-GR10', category: 'Tuition', amount: 1500, active: true },
    { id: '2', name: 'Bus Transport - Route A', code: 'BUS-RTA', category: 'Transport', amount: 300, active: true },
    { id: '3', name: 'Science Lab Material Fee', code: 'LAB-SCI', category: 'Facility', amount: 150, active: false },
    { id: '4', name: 'Annual Sports Kit', code: 'SPT-KIT', category: 'Uniforms', amount: 120, active: true },
    { id: '5', name: 'Semester Assessment Exams', code: 'EXM-SEM', category: 'Exam', amount: 250, active: true }
];

const defaultFeeStructures: FeeStructure[] = [
    {
        id: 'struct-1',
        name: 'Grade 10 Tuition & Kit Structure',
        academicYear: '2026-2027',
        term: 'Term 1',
        gradeClass: 'Grade 10',
        currency: 'USD',
        active: true,
        isUsed: true, // In-use structure (deletion blocked)
        items: [
            { feeTypeId: '1', amount: 1500 },
            { feeTypeId: '4', amount: 120 }
        ]
    },
    {
        id: 'struct-2',
        name: 'Grade 11 Term 1 Standard Structure',
        academicYear: '2026-2027',
        term: 'Term 1',
        gradeClass: 'Grade 11',
        currency: 'USD',
        active: true,
        isUsed: false, // Unused structure (deletion permitted)
        items: [
            { feeTypeId: '2', amount: 300 }
        ]
    },
    {
        id: 'struct-3',
        name: 'Grade 10 Special Sports Program',
        academicYear: '2026-2027',
        term: 'Term 1',
        gradeClass: 'Grade 10',
        currency: 'USD',
        active: false, // Inactive (Grade 10 Term 1 already has struct-1 active)
        isUsed: false,
        items: [
            { feeTypeId: '4', amount: 100 }
        ]
    }
];

export default function FeeStructuresListPage() {
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedTerm, setSelectedTerm] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        // Load fee types
        const storedTypes = localStorage.getItem('antigravity_fee_types');
        let currentTypes = defaultFeeTypes;
        if (storedTypes) {
            try {
                currentTypes = JSON.parse(storedTypes);
                setFeeTypes(currentTypes);
            } catch (e) {
                setFeeTypes(defaultFeeTypes);
            }
        } else {
            setFeeTypes(defaultFeeTypes);
            localStorage.setItem('antigravity_fee_types', JSON.stringify(defaultFeeTypes));
        }

        // Load fee structures
        const storedStructs = localStorage.getItem('antigravity_fee_structures');
        if (storedStructs) {
            try {
                setFeeStructures(JSON.parse(storedStructs));
            } catch (e) {
                setFeeStructures(defaultFeeStructures);
                localStorage.setItem('antigravity_fee_structures', JSON.stringify(defaultFeeStructures));
            }
        } else {
            setFeeStructures(defaultFeeStructures);
            localStorage.setItem('antigravity_fee_structures', JSON.stringify(defaultFeeStructures));
        }
    }, []);

    // Save helpers
    const saveStructures = (list: FeeStructure[]) => {
        setFeeStructures(list);
        localStorage.setItem('antigravity_fee_structures', JSON.stringify(list));
    };

    // Calculate total amount for a structure
    const calculateTotal = (structure: FeeStructure) => {
        return structure.items.reduce((sum, item) => sum + item.amount, 0);
    };

    // Uniqueness business rule check: One active structure per Class + Year + Term
    const checkActiveUniqueness = (structure: FeeStructure, list: FeeStructure[]) => {
        return !list.some(item => 
            item.id !== structure.id &&
            item.active &&
            item.gradeClass.toLowerCase() === structure.gradeClass.toLowerCase() &&
            item.academicYear.toLowerCase() === structure.academicYear.toLowerCase() &&
            item.term.toLowerCase() === structure.term.toLowerCase()
        );
    };

    // Toggle Active Status inline
    const handleToggleActive = (id: string) => {
        setErrorMessage(null);
        const target = feeStructures.find(item => item.id === id);
        if (!target) return;

        const nextActiveState = !target.active;

        if (nextActiveState) {
            // Check business rule before allowing activation
            const canActivate = checkActiveUniqueness({ ...target, active: true }, feeStructures);
            if (!canActivate) {
                setErrorMessage(`Activation blocked: An active structure already exists for ${target.gradeClass} (${target.academicYear} - ${target.term}). Please deactivate it first.`);
                return;
            }
        }

        const updated = feeStructures.map(item => 
            item.id === id ? { ...item, active: nextActiveState } : item
        );
        saveStructures(updated);
    };

    // Duplicate structure
    const handleDuplicate = (structure: FeeStructure) => {
        setErrorMessage(null);
        const duplicatedStruct: FeeStructure = {
            ...structure,
            id: 'struct-' + Date.now(),
            name: `${structure.name} - Copy`,
            active: false, // Default duplicates to inactive to prevent conflicts
            isUsed: false, // Newly duplicated structure starts unused
        };

        const updated = [...feeStructures, duplicatedStruct];
        saveStructures(updated);
    };

    // Delete Structure
    const handleDelete = (id: string) => {
        setErrorMessage(null);
        const target = feeStructures.find(item => item.id === id);
        if (!target) return;

        // Business rule: Delete only if unused
        if (target.isUsed) {
            setErrorMessage(`Cannot delete structure "${target.name}": It has already been assigned to student accounts.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete "${target.name}"?`)) {
            const updated = feeStructures.filter(item => item.id !== id);
            saveStructures(updated);
        }
    };

    // Dynamic dropdown values
    const grades = ['All', ...Array.from(new Set(feeStructures.map(f => f.gradeClass)))];
    const academicYears = ['All', ...Array.from(new Set(feeStructures.map(f => f.academicYear)))];
    const terms = ['All', ...Array.from(new Set(feeStructures.map(f => f.term)))];

    // Filter Logic
    const filteredStructures = feeStructures.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGrade = selectedGrade === 'All' || item.gradeClass === selectedGrade;
        const matchesYear = selectedYear === 'All' || item.academicYear === selectedYear;
        const matchesTerm = selectedTerm === 'All' || item.term === selectedTerm;
        const matchesStatus = 
            selectedStatus === 'All' || 
            (selectedStatus === 'Active' && item.active) || 
            (selectedStatus === 'Inactive' && !item.active);

        return matchesSearch && matchesGrade && matchesYear && matchesTerm && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Fee Structures</h2>
                    <p className="text-slate-500 font-medium">Create and compile standard termly billing structures for grades.</p>
                </div>
                <Link 
                    href="/finance/fee-structures/create"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/50 transition-all cursor-pointer shadow-md shadow-emerald-100"
                >
                    <span className="text-sm font-bold">+</span> Create Fee Structure
                </Link>
            </div>

            {/* Error notifications */}
            {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-black uppercase tracking-tight relative flex items-center justify-between">
                    <span>⚠️ {errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600 text-sm ml-4 font-black">✕</button>
                </div>
            )}

            {/* Filter and Search Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input 
                                type="text"
                                placeholder="Structure Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Class/Grade Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Grade Level</label>
                        <select 
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            {grades.map(g => (
                                <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Year Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Academic Year</label>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            {academicYears.map(y => (
                                <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Term Filter */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Term</label>
                        <select 
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        >
                            {terms.map(t => (
                                <option key={t} value={t}>{t === 'All' ? 'All Terms' : t}</option>
                            ))}
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

            {/* Structures List Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto border border-slate-50 rounded-2xl p-4">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Structure Name</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Grade Level</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Year</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Term</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Total Items</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Active Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredStructures.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400 font-medium italic">
                                        No fee structures found matching the current search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredStructures.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight text-sm">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wide">
                                            {item.gradeClass}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-500">
                                            {item.academicYear}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-500">
                                            {item.term}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                                            {item.items.length}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-slate-800 text-sm">
                                            {item.currency === 'USD' ? '$' : item.currency + ' '}{calculateTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleToggleActive(item.id)}
                                                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.active ? 'bg-emerald-600' : 'bg-slate-200'}`}
                                                title={item.active ? 'Deactivate' : 'Activate'}
                                            >
                                                <span 
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.active ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2.5">
                                                <Link 
                                                    href={`/finance/fee-structures/${item.id}`}
                                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-black uppercase tracking-widest text-[9px] rounded-lg text-slate-500 transition-colors"
                                                >
                                                    View
                                                </Link>
                                                <Link 
                                                    href={`/finance/fee-structures/${item.id}/edit`}
                                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-black uppercase tracking-widest text-[9px] rounded-lg text-slate-500 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button 
                                                    onClick={() => handleDuplicate(item)}
                                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-black uppercase tracking-widest text-[9px] rounded-lg text-slate-500 transition-colors"
                                                >
                                                    Duplicate
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className={`px-2.5 py-1.5 bg-slate-50 border border-slate-200 font-black uppercase tracking-widest text-[9px] rounded-lg transition-colors ${item.isUsed ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-500'}`}
                                                    title={item.isUsed ? 'In Use (Cannot Delete)' : 'Delete'}
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
