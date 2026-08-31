'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DBStudent {
    id: string;
    student_id: string;
    full_name: string;
    academic_year: string;
    class: {
        id: string;
        name: string;
    } | null;
}

interface FeeItem {
    id: string;
    name: string;
    code: string;
    category: string;
    amount: number;
    dueDate: string;
}

interface PaymentItem {
    id: string;
    amount: number;
    date: string;
    method: string;
    reference: string;
    feeName: string;
    notes: string;
}

interface StatementData {
    student: DBStudent;
    charges: FeeItem[];
    payments: PaymentItem[];
    totalCharges: number;
    totalPayments: number;
    currentBalance: number;
}



export default function StudentStatementPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createClient();
    const { id } = use(params);

    const [statement, setStatement] = useState<StatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStatement() {
            try {
                setLoading(true);
                setErrorMessage(null);

                // 1. Fetch student
                const { data: dbStudent, error: studErr } = await supabase
                    .from('students')
                    .select(`
                        id,
                        student_id,
                        full_name,
                        academic_year,
                        class:classes(id, name)
                    `)
                    .eq('id', id)
                    .maybeSingle();

                if (studErr) {
                    throw new Error(`Failed to fetch student profile: ${studErr.message}`);
                }
                if (!dbStudent) {
                    setNotFound(true);
                    return;
                }
                const student = (dbStudent as any) as DBStudent;

                // 2. Fetch charges (student_fees)
                const { data: dbFees, error: feesErr } = await supabase
                    .from('student_fees')
                    .select(`
                        id,
                        total_amount,
                        paid_amount,
                        due_date,
                        fee_type:fee_types(id, name, code, category)
                    `)
                    .eq('student_id', id);

                if (feesErr) {
                    throw new Error(`Failed to fetch student charges: ${feesErr.message}`);
                }

                // 3. Fetch payments
                const { data: dbPayments, error: payErr } = await supabase
                    .from('fee_payments')
                    .select(`
                        id,
                        amount_paid,
                        payment_date,
                        payment_method,
                        reference_number,
                        notes,
                        student_fee:student_fees!inner(
                            student_id,
                            fee_type:fee_types(name)
                        )
                    `)
                    .eq('student_fee.student_id', id);

                if (payErr) {
                    throw new Error(`Failed to fetch payment history: ${payErr.message}`);
                }

                // Populate from database
                const charges: FeeItem[] = (dbFees || []).map((f: any) => ({
                    id: f.id,
                    name: f.fee_type?.name || 'Assigned Fee',
                    code: f.fee_type?.code || 'FEE',
                    category: f.fee_type?.category || 'Others',
                    amount: Number(f.total_amount),
                    dueDate: f.due_date || 'N/A'
                }));

                const payments: PaymentItem[] = (dbPayments || []).map((p: any) => ({
                    id: p.id,
                    amount: Number(p.amount_paid),
                    date: p.payment_date,
                    method: p.payment_method || 'N/A',
                    reference: p.reference_number || 'N/A',
                    feeName: p.student_fee?.fee_type?.name || 'Assigned Fee',
                    notes: p.notes || ''
                }));

                const totalCharges = charges.reduce((sum, item) => sum + item.amount, 0);
                const totalPayments = payments.reduce((sum, item) => sum + item.amount, 0);

                setStatement({
                    student,
                    charges,
                    payments,
                    totalCharges,
                    totalPayments,
                    currentBalance: totalCharges - totalPayments
                });

            } catch (e) {
                console.error(e);
                setErrorMessage(e instanceof Error ? e.message : 'Error generating statement details.');
            } finally {
                setLoading(false);
            }
        }
        void fetchStatement();
    }, [id, supabase]);

    // Print automatically once statement is loaded
    useEffect(() => {
        if (statement) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [statement]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Generating Statement layout...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Error Generating Statement</p>
                <p className="text-red-600 text-sm mb-6">{errorMessage}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs transition-all shadow-md cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (notFound || !statement) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Statement Record Not Found</p>
                <p className="text-red-600 text-sm">The student fee statement details could not be generated.</p>
            </div>
        );
    }

    const { student, charges, payments, totalCharges, totalPayments, currentBalance } = statement;

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans p-6 sm:p-12 max-w-3xl mx-auto shadow-sm relative">
            
            {/* Top Toolbar - hidden in printing */}
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="text-xs">
                    <p className="font-bold text-slate-700">Student Statement Ready to Print / Download PDF</p>
                    <p className="text-slate-500">Your browser&apos;s printing dialog should trigger automatically.</p>
                </div>
                <div className="flex gap-2.5">
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                    >
                        🖨️ Print Statement
                    </button>
                    <button 
                        onClick={() => window.close()}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Close Window
                    </button>
                </div>
            </div>

            {/* Print Content Area */}
            <div className="space-y-8 p-6 border border-slate-100 rounded-3xl">
                
                {/* Logo & Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">▲</span>
                            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">Antigravity Academy</h1>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee Account Statement</p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider space-y-0.5">
                        <p>100 Gravity Way, Silicon Valley</p>
                        <p>Tel: +1 (555) 019-2831</p>
                        <p>Email: finance@antigravity.edu</p>
                    </div>
                </div>

                {/* Date generated info */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Statement Issued: {new Date().toISOString().split('T')[0]}</span>
                    <span>Billing cycle: Term 1</span>
                </div>

                {/* Student Details */}
                <div className="space-y-3 bg-slate-50 p-6 rounded-2xl">
                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b pb-1.5">Student Profile</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700 uppercase tracking-tight">
                        <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 block tracking-wider">Student Name</span>
                            <span className="text-slate-900">{student.full_name}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 block tracking-wider">Student ID</span>
                            <span className="font-mono text-slate-900">#{student.student_id}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 block tracking-wider">Class / Section</span>
                            <span className="text-slate-900">{student.class?.name || 'Unassigned'}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 block tracking-wider">Academic Session</span>
                            <span className="text-slate-900">{student.academic_year || '2026/2027'}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Metrics */}
                <div className="grid grid-cols-3 gap-4 border border-slate-100 rounded-2xl p-5 text-center">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Charges</p>
                        <p className="font-mono font-black text-slate-800 text-lg mt-0.5">${totalCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Payments</p>
                        <p className="font-mono font-black text-emerald-600 text-lg mt-0.5">${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-rose-700 uppercase tracking-widest">Outstanding Arrears</p>
                        <p className="font-mono font-black text-rose-600 text-lg mt-0.5">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* Section A: Fee Allocations (Charges) */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1.5">Fee Allocations (Charges)</h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Fee Code</th>
                                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                    <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {charges.map(c => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight text-xs">{c.name}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-500 uppercase">{c.code}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-500 uppercase">{c.category}</td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-medium">{c.dueDate}</td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-slate-800">${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section B: Receipts & Transactions (Payments) */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1.5">Transactions Ledger (Payments)</h3>
                    {payments.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic py-2 pl-2">No payments have been recorded for this period.</p>
                    ) : (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100 text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Processed Date</th>
                                        <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                                        <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Method</th>
                                        <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Fee Allocation</th>
                                        <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 text-slate-400 font-medium">{p.date}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-500 uppercase">{p.reference}</td>
                                            <td className="px-6 py-4 font-bold text-slate-500 uppercase">{p.method}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-600 uppercase">{p.feeName}</td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Final Signature / Authority */}
                <div className="flex flex-col sm:flex-row justify-between items-end pt-8 border-t gap-8">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <p>Official statement generated by School Finance Office.</p>
                        <p className="mt-1">For queries contact: support@antigravity.edu</p>
                    </div>
                    
                    <div className="w-48 text-center border-t border-dashed pt-2">
                        <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Finance Director Sign</p>
                        <div className="h-8"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}
