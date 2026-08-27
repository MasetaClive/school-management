'use client';

import React, { useState, useEffect, use } from 'react';
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

export default function ViewFeeStructurePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [structure, setStructure] = useState<FeeStructure | null>(null);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        // Load fee types
        const storedTypes = localStorage.getItem('antigravity_fee_types');
        let parsedTypes: FeeType[] = [];
        if (storedTypes) {
            try {
                parsedTypes = JSON.parse(storedTypes);
                setFeeTypes(parsedTypes);
            } catch (e) {
                console.error(e);
            }
        }

        // Load structures
        const storedStructs = localStorage.getItem('antigravity_fee_structures');
        if (storedStructs) {
            try {
                const list: FeeStructure[] = JSON.parse(storedStructs);
                const current = list.find(s => s.id === id);
                if (current) {
                    setStructure(current);
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                setNotFound(true);
            }
        } else {
            setNotFound(true);
        }
        setLoading(false);
    }, [id]);

    // Resolve name & code of fee type
    const getFeeTypeDetails = (typeId: string) => {
        const found = feeTypes.find(t => t.id === typeId);
        if (found) {
            return {
                name: found.name,
                code: found.code,
                category: found.category
            };
        }
        return {
            name: 'Unknown Fee Type',
            code: 'N/A',
            category: 'N/A'
        };
    };

    // Calculate total amount
    const calculateTotal = () => {
        if (!structure) return 0;
        return structure.items.reduce((sum, item) => sum + item.amount, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading fee structure details...</p>
            </div>
        );
    }

    if (notFound || !structure) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Structure Not Found</p>
                <p className="text-red-600 text-sm mb-6">The requested fee structure does not exist or has been deleted.</p>
                <Link 
                    href="/finance/fee-structures" 
                    className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all shadow-md"
                >
                    Back to Fee Structures
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Breadcrumb Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link 
                            href="/finance/fee-structures"
                            className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                            Fee Structures
                        </Link>
                        <span className="text-[10px] text-slate-300">/</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">{structure.name}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic truncate max-w-lg">{structure.name}</h2>
                    <p className="text-slate-500 font-medium">Review basic details and allocated items of this structure.</p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                    <Link 
                        href={`/finance/fee-structures/${structure.id}/edit`}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-emerald-100/50 flex items-center justify-center"
                    >
                        Edit Structure
                    </Link>
                    <Link 
                        href="/finance/fee-structures"
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center"
                    >
                        Back
                    </Link>
                </div>
            </div>

            {/* Basic details layout */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b pb-2">Structure Details</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class/Grade</p>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{structure.gradeClass}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Year</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight mt-1">{structure.academicYear}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Term</p>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{structure.term}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Currency</p>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{structure.currency}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Status</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1.5 ${structure.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {structure.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Billing Context</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1.5 ${structure.isUsed ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {structure.isUsed ? 'In Use (Billed)' : 'Unused (Draft)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Allocated items layout */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider">
                        Allocated Fee Items
                    </h3>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Item Name</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {structure.items.map((item, idx) => {
                                    const details = getFeeTypeDetails(item.feeTypeId);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight text-sm">
                                                {details.name}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-500">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                                    {details.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                                    {details.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-slate-800 text-sm">
                                                {structure.currency === 'USD' ? '$' : structure.currency + ' '}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Grand Total banner */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex justify-between items-center mt-6">
                        <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">Calculated Grand Total:</span>
                        <span className="font-mono font-black text-emerald-800 text-xl">
                            {structure.currency === 'USD' ? '$' : structure.currency + ' '}{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
