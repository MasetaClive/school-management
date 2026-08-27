'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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

export default function EditFeeTypePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Form fields state
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [category, setCategory] = useState('Tuition');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [billingFrequency, setBillingFrequency] = useState<'Once' | 'Monthly' | 'Termly' | 'Semester' | 'Yearly'>('Termly');
    const [mandatory, setMandatory] = useState(true);
    const [active, setActive] = useState(true);
    
    // Validation states
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const stored = localStorage.getItem('antigravity_fee_types');
        if (stored) {
            try {
                const list: FeeType[] = JSON.parse(stored);
                setFeeTypes(list);
                
                const current = list.find(item => item.id === id);
                if (current) {
                    setName(current.name);
                    setCode(current.code);
                    setCategory(current.category);
                    setDescription(current.description);
                    setAmount(current.amount.toString());
                    setCurrency(current.currency);
                    setBillingFrequency(current.billingFrequency);
                    setMandatory(current.mandatory);
                    setActive(current.active);
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error(e);
                setNotFound(true);
            }
        } else {
            setNotFound(true);
        }
        setLoading(false);
    }, [id]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Fee name is required.';
        if (!code.trim()) {
            newErrors.code = 'Fee code is required.';
        } else {
            // Check for uniqueness of fee code, excluding the current item being edited
            const codeExists = feeTypes.some(item => item.id !== id && item.code.toUpperCase() === code.trim().toUpperCase());
            if (codeExists) {
                newErrors.code = 'A fee type with this code already exists.';
            }
        }
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            newErrors.amount = 'Please enter a valid amount (0 or higher).';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        const updatedList = feeTypes.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                    category,
                    description: description.trim(),
                    amount: parseFloat(amount),
                    currency,
                    billingFrequency,
                    mandatory,
                    active,
                };
            }
            return item;
        });

        localStorage.setItem('antigravity_fee_types', JSON.stringify(updatedList));
        router.push('/finance/fee-types');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading fee type details...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Fee Type Not Found</p>
                <p className="text-red-600 text-sm mb-6">The requested fee structure does not exist or has been deleted.</p>
                <Link 
                    href="/finance/fee-types" 
                    className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all shadow-md"
                >
                    Back to Fee Types
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Breadcrumb Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link 
                        href="/finance/fee-types"
                        className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        Fee Types
                    </Link>
                    <span className="text-[10px] text-slate-300">/</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Edit {code}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Edit Fee Type</h2>
                <p className="text-slate-500 font-medium">Modify existing fee configurations and settings.</p>
            </div>

            {/* Edit Form Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Fee Name */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Fee Name *</label>
                            <input 
                                type="text"
                                placeholder="e.g. Tuition Fee - Term 1"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full bg-slate-50 border ${errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-colors`}
                            />
                            {errors.name && <p className="text-rose-500 text-[10px] font-bold">{errors.name}</p>}
                        </div>

                        {/* Fee Code */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Fee Code *</label>
                            <input 
                                type="text"
                                placeholder="e.g. TUI-T1"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className={`w-full bg-slate-50 border ${errors.code ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-colors`}
                            />
                            {errors.code && <p className="text-rose-500 text-[10px] font-bold">{errors.code}</p>}
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Category *</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                            >
                                <option value="Tuition">Tuition</option>
                                <option value="Transport">Transport</option>
                                <option value="Meals">Meals</option>
                                <option value="Library">Library</option>
                                <option value="Exam">Exam</option>
                                <option value="Uniforms">Uniforms</option>
                                <option value="Facility">Facility</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>

                        {/* Billing Frequency */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Billing Frequency *</label>
                            <select 
                                value={billingFrequency}
                                onChange={(e) => setBillingFrequency(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                            >
                                <option value="Once">Once</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Termly">Termly</option>
                                <option value="Semester">Semester</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount *</label>
                            <input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-full bg-slate-50 border ${errors.amount ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none transition-colors`}
                            />
                            {errors.amount && <p className="text-rose-500 text-[10px] font-bold">{errors.amount}</p>}
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
                                <option value="GBP">GBP (£)</option>
                                <option value="UGX">UGX (Shs)</option>
                                <option value="KES">KES (Ksh)</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</label>
                        <textarea 
                            rows={3}
                            placeholder="Enter a brief description explaining what this fee type covers..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Switched options for Mandatory & Active */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-slate-50">
                        {/* Mandatory Switch */}
                        <div className="flex items-center justify-between sm:justify-start gap-4">
                            <button 
                                type="button"
                                onClick={() => setMandatory(!mandatory)}
                                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${mandatory ? 'bg-emerald-600' : 'bg-slate-200'}`}
                            >
                                <span 
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${mandatory ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Mandatory Fee</p>
                                <p className="text-[9px] text-slate-400 font-medium">Fee will automatically be assigned to all students in the structures.</p>
                            </div>
                        </div>

                        {/* Active Switch */}
                        <div className="flex items-center justify-between sm:justify-start gap-4">
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
                                <p className="text-[9px] text-slate-400 font-medium">Inactive fee structures cannot be assigned to new accounts.</p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
                        <Link 
                            href="/finance/fee-types"
                            className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer shadow-md shadow-emerald-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
