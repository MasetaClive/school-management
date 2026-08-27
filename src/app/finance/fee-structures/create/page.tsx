'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface SelectedItem {
    feeTypeId: string;
    amount: number;
}

const defaultFeeTypes: FeeType[] = [
    { id: '1', name: 'Tuition Fee - Grade 10', code: 'TUI-GR10', category: 'Tuition', amount: 1500, active: true },
    { id: '2', name: 'Bus Transport - Route A', code: 'BUS-RTA', category: 'Transport', amount: 300, active: true }
];

export default function CreateFeeStructurePage() {
    const router = useRouter();
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [activeFeeTypes, setActiveFeeTypes] = useState<FeeType[]>([]);
    
    // Form fields state
    const [name, setName] = useState('');
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [term, setTerm] = useState('Term 1');
    const [gradeClass, setGradeClass] = useState('Grade 10');
    const [currency, setCurrency] = useState('USD');
    const [active, setActive] = useState(true);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
        { feeTypeId: '', amount: 0 } // Initialize with one empty item row
    ]);

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Load fee types - only filter active ones
        const storedTypes = localStorage.getItem('antigravity_fee_types');
        let parsedTypes: FeeType[] = [];
        if (storedTypes) {
            try {
                parsedTypes = JSON.parse(storedTypes);
            } catch (e) {
                parsedTypes = defaultFeeTypes;
            }
        } else {
            parsedTypes = defaultFeeTypes;
        }
        
        // Rule: Only active Fee Types can be selected
        setActiveFeeTypes(parsedTypes.filter(t => t.active));

        // Load structures
        const storedStructs = localStorage.getItem('antigravity_fee_structures');
        if (storedStructs) {
            try {
                setStructures(JSON.parse(storedStructs));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Add new fee item row
    const handleAddItemRow = () => {
        setSelectedItems([...selectedItems, { feeTypeId: '', amount: 0 }]);
    };

    // Remove fee item row
    const handleRemoveItemRow = (index: number) => {
        const updated = selectedItems.filter((_, idx) => idx !== index);
        setSelectedItems(updated);
    };

    // Handle change of fee type selection
    const handleFeeTypeChange = (index: number, typeId: string) => {
        const updated = [...selectedItems];
        updated[index].feeTypeId = typeId;
        
        // Auto pre-populate amount with standard default fee type amount
        const matchingType = activeFeeTypes.find(t => t.id === typeId);
        if (matchingType) {
            updated[index].amount = matchingType.amount;
        } else {
            updated[index].amount = 0;
        }

        setSelectedItems(updated);
    };

    // Handle change of fee item amount
    const handleAmountChange = (index: number, amountVal: string) => {
        const updated = [...selectedItems];
        updated[index].amount = parseFloat(amountVal) || 0;
        setSelectedItems(updated);
    };

    // Calculated total automatically
    const totalFees = selectedItems.reduce((sum, item) => sum + item.amount, 0);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!name.trim()) newErrors.name = 'Structure name is required.';
        if (!academicYear.trim()) newErrors.academicYear = 'Academic year is required.';

        // Rule: Must contain at least one Fee Item
        const validItems = selectedItems.filter(item => item.feeTypeId !== '');
        if (validItems.length === 0) {
            newErrors.items = 'Please select and specify at least one valid Fee Item.';
        }

        // Rule: One active Fee Structure per Class + Academic Year + Term
        if (active) {
            const hasDuplicateActive = structures.some(s => 
                s.active &&
                s.gradeClass.toLowerCase() === gradeClass.toLowerCase() &&
                s.academicYear.toLowerCase() === academicYear.toLowerCase() &&
                s.term.toLowerCase() === term.toLowerCase()
            );
            if (hasDuplicateActive) {
                newErrors.active = `An active structure already exists for ${gradeClass} (${academicYear} - ${term}).`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Clean items (remove unselected items)
        const cleanedItems = selectedItems
            .filter(item => item.feeTypeId !== '')
            .map(item => ({
                feeTypeId: item.feeTypeId,
                amount: item.amount
            }));

        const newStructure: FeeStructure = {
            id: 'struct-' + Date.now(),
            name: name.trim(),
            gradeClass,
            academicYear: academicYear.trim(),
            term,
            currency,
            active,
            isUsed: false,
            items: cleanedItems
        };

        const updated = [...structures, newStructure];
        localStorage.setItem('antigravity_fee_structures', JSON.stringify(updated));
        router.push('/finance/fee-structures');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Breadcrumb Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link 
                        href="/finance/fee-structures"
                        className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        Fee Structures
                    </Link>
                    <span className="text-[10px] text-slate-300">/</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Create New</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Create Fee Structure</h2>
                <p className="text-slate-500 font-medium">Create a new bundled billing allocation structure for classes.</p>
            </div>

            {/* Creation Form Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    {/* Basic details section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b pb-2">Basic Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Structure Name */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Structure Name *</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Grade 10 Standard Billing"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-slate-50 border ${errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-colors`}
                                />
                                {errors.name && <p className="text-rose-500 text-[10px] font-bold">{errors.name}</p>}
                            </div>

                            {/* Class/Grade select */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Class/Grade *</label>
                                <select 
                                    value={gradeClass}
                                    onChange={(e) => setGradeClass(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>
                            </div>

                            {/* Academic Year input */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Year *</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. 2026-2027"
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                    className={`w-full bg-slate-50 border ${errors.academicYear ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-colors`}
                                />
                                {errors.academicYear && <p className="text-rose-500 text-[10px] font-bold">{errors.academicYear}</p>}
                            </div>

                            {/* Term select */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Term *</label>
                                <select 
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                            </div>

                            {/* Currency */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Currency *</label>
                                <select 
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="UGX">UGX (Shs)</option>
                                    <option value="KES">KES (Ksh)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fee Items list section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Fee Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItemRow}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-emerald-100"
                            >
                                + Add Fee Item
                            </button>
                        </div>
                        {errors.items && <p className="text-rose-500 text-[10px] font-bold">{errors.items}</p>}

                        {/* List items dynamic rows */}
                        <div className="space-y-3">
                            {selectedItems.map((item, index) => (
                                <div key={index} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-top-1 duration-150">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Select fee type */}
                                        <div className="space-y-1">
                                            <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Select Fee Type</label>
                                            <select
                                                value={item.feeTypeId}
                                                onChange={(e) => handleFeeTypeChange(index, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            >
                                                <option value="">-- Choose Active Fee Type --</option>
                                                {activeFeeTypes.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Override Amount */}
                                        <div className="space-y-1">
                                            <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Billing Amount ({currency})</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.amount || ''}
                                                onChange={(e) => handleAmountChange(index, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Delete row button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItemRow(index)}
                                        className="h-8 w-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center text-sm font-bold border border-slate-200/50 mt-4 sm:mt-2"
                                        title="Remove Row"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Calculated total summary */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Calculated Total Structure Amount:</span>
                            <span className="font-mono font-black text-emerald-800 text-lg">
                                {currency === 'USD' ? '$' : currency + ' '}{totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Active structure configuration switch */}
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={() => setActive(!active)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-emerald-600' : 'bg-slate-200'}`}
                        >
                            <span 
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Active Status</p>
                            <p className="text-[9px] text-slate-400 font-medium">Only active fee structures will be used to bill student accounts for the specific class/term.</p>
                            {errors.active && <p className="text-rose-500 text-[10px] font-bold mt-1">⚠️ {errors.active}</p>}
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
                        <Link 
                            href="/finance/fee-structures"
                            className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer shadow-md shadow-emerald-50"
                        >
                            Save Structure
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
