'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
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

interface AssignedFeeItem {
    id: string;
    feeName: string;
    feeCode: string;
    category: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    dueDate: string;
    status: 'Paid' | 'Partially Paid' | 'Unpaid';
}

// Generate the matching mock list to keep details exactly synced with listing page calculations
const getMockItems = (index: number): AssignedFeeItem[] => {
    const defaultDate = '2026-09-01';
    
    switch (index % 6) {
        case 0: // Partially Paid: Assigned $1,800, Paid $1,200, Balance $600
            return [
                { id: 'm1', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1500, paidAmount: 1200, balance: 300, dueDate: defaultDate, status: 'Partially Paid' },
                { id: 'm2', feeName: 'Bus Transport - Route A', feeCode: 'BUS-RTA', category: 'Transport', totalAmount: 300, paidAmount: 0, balance: 300, dueDate: defaultDate, status: 'Unpaid' }
            ];
        case 1: // Paid: Assigned $1,500, Paid $1,500, Balance $0
            return [
                { id: 'm3', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1500, paidAmount: 1500, balance: 0, dueDate: defaultDate, status: 'Paid' }
            ];
        case 2: // Outstanding: Assigned $2,000, Paid $0, Balance $2,000
            return [
                { id: 'm4', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1700, paidAmount: 0, balance: 1700, dueDate: defaultDate, status: 'Unpaid' },
                { id: 'm5', feeName: 'Bus Transport - Route A', feeCode: 'BUS-RTA', category: 'Transport', totalAmount: 300, paidAmount: 0, balance: 300, dueDate: defaultDate, status: 'Unpaid' }
            ];
        case 3: // Partially Paid: Assigned $1,650, Paid $1,000, Balance $650
            return [
                { id: 'm6', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1500, paidAmount: 1000, balance: 500, dueDate: defaultDate, status: 'Partially Paid' },
                { id: 'm7', feeName: 'Science Lab Material Fee', feeCode: 'LAB-SCI', category: 'Facility', totalAmount: 150, paidAmount: 0, balance: 150, dueDate: defaultDate, status: 'Unpaid' }
            ];
        case 4: // Paid: Assigned $1,800, Paid $1,800, Balance $0
            return [
                { id: 'm8', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1500, paidAmount: 1500, balance: 0, dueDate: defaultDate, status: 'Paid' },
                { id: 'm9', feeName: 'Bus Transport - Route A', feeCode: 'BUS-RTA', category: 'Transport', totalAmount: 300, paidAmount: 300, balance: 0, dueDate: defaultDate, status: 'Paid' }
            ];
        case 5: // Partially Paid: Assigned $1,500, Paid $500, Balance $1,000
        default:
            return [
                { id: 'm10', feeName: 'Tuition Fee - Grade 10', feeCode: 'TUI-GR10', category: 'Tuition', totalAmount: 1500, paidAmount: 500, balance: 1000, dueDate: defaultDate, status: 'Partially Paid' }
            ];
    }
};

export default function StudentFeeAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createClient();
    const { id } = use(params);

    const [student, setStudent] = useState<DBStudent | null>(null);
    const [feeItems, setFeeItems] = useState<AssignedFeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchStudentAccount() {
            try {
                setLoading(true);

                // 1. Fetch student detail
                const { data: dbStudent, error: studentError } = await supabase
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

                if (studentError || !dbStudent) {
                    setNotFound(true);
                    return;
                }
                setStudent((dbStudent as any) as DBStudent);

                // 2. Fetch all student fees for this specific student
                const { data: dbFees, error: feesError } = await supabase
                    .from('student_fees')
                    .select(`
                        id,
                        total_amount,
                        paid_amount,
                        status,
                        due_date,
                        academic_year,
                        fee_type:fee_types(name, code, category)
                    `)
                    .eq('student_id', id);

                if (feesError) {
                    console.error('Error fetching student fees:', feesError);
                    return;
                }

                if (dbFees && dbFees.length > 0) {
                    // Map database items directly
                    const mapped: AssignedFeeItem[] = dbFees.map((f: any) => {
                        let statusVal: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
                        if (f.status === 'paid') statusVal = 'Paid';
                        else if (f.status === 'partial') statusVal = 'Partially Paid';

                        return {
                            id: f.id,
                            feeName: f.fee_type?.name || 'Unspecified Fee',
                            feeCode: f.fee_type?.code || 'FEE',
                            category: f.fee_type?.category || 'Others',
                            totalAmount: Number(f.total_amount),
                            paidAmount: Number(f.paid_amount),
                            balance: Number(f.total_amount) - Number(f.paid_amount),
                            dueDate: f.due_date || 'N/A',
                            status: statusVal
                        };
                    });
                    setFeeItems(mapped);
                } else {
                    // Database student_fees is empty, so we generate the corresponding mockup list matching list page
                    const { data: dbAllStudents } = await supabase
                        .from('students')
                        .select('id')
                        .order('full_name', { ascending: true });

                    const studentIndex = dbAllStudents?.findIndex(s => s.id === id) ?? 0;
                    setFeeItems(getMockItems(studentIndex));
                }

            } catch (err) {
                console.error('Error loading account detail:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }

        void fetchStudentAccount();
    }, [id, supabase]);

    // Totals calculations
    const totalAssigned = feeItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPaid = feeItems.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalBalance = totalAssigned - totalPaid;

    let overallStatus: 'Paid' | 'Partially Paid' | 'Outstanding' = 'Outstanding';
    if (totalAssigned === 0) {
        overallStatus = 'Paid';
    } else if (totalPaid === 0) {
        overallStatus = 'Outstanding';
    } else if (totalPaid >= totalAssigned) {
        overallStatus = 'Paid';
    } else {
        overallStatus = 'Partially Paid';
    }

    let overallStatusBadge = 'bg-rose-100 text-rose-700 border-rose-200';
    if (overallStatus === 'Paid') {
        overallStatusBadge = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (overallStatus === 'Partially Paid') {
        overallStatusBadge = 'bg-amber-100 text-amber-700 border-amber-200';
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Ledger Details...</p>
            </div>
        );
    }

    if (notFound || !student) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Student Account Not Found</p>
                <p className="text-red-600 text-sm mb-6">The requested student account could not be found or has been removed.</p>
                <Link 
                    href="/finance/student-accounts" 
                    className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all shadow-md"
                >
                    Back to Student Accounts
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Breadcrumb Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link 
                            href="/finance/student-accounts"
                            className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                            Student Accounts
                        </Link>
                        <span className="text-[10px] text-slate-300">/</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">{student.full_name}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic truncate max-w-lg">{student.full_name}</h2>
                    <p className="text-slate-500 font-medium">Ledger ID: <span className="font-bold font-mono text-slate-700">#{student.student_id}</span></p>
                </div>
                
                <div className="flex gap-2.5">
                    <a 
                        href={`/finance/student-accounts/${student.id}/statement`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center shadow-sm cursor-pointer"
                    >
                        🖨️ Print Statement
                    </a>
                    <Link 
                        href="/finance/student-accounts"
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center shadow-sm"
                    >
                        Back to Accounts List
                    </Link>
                </div>
            </div>

            {/* Student Metadata Info Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b pb-2">Student Ledger Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class/Section</p>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{student.class?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Year</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight mt-1">{student.academic_year || '2026/2027'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Billing Period</p>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">Term 1</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Standing</p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1.5 border ${overallStatusBadge}`}>
                            {overallStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assigned Fees</p>
                        <h4 className="text-3xl font-black text-slate-900">${totalAssigned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                        <p className="text-[9px] text-slate-400 font-medium pt-2 border-t mt-2">Combined allocations for the term</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payments Made</p>
                        <h4 className="text-3xl font-black text-emerald-600">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                        <p className="text-[9px] text-slate-400 font-medium pt-2 border-t mt-2">Processed and cleared transactions</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Arrears</p>
                        <h4 className="text-3xl font-black text-rose-600">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                        <p className="text-[9px] text-slate-400 font-medium pt-2 border-t mt-2">Remaining pending balances</p>
                    </div>
                </div>
            </div>

            {/* Allocated Fee Items table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider">
                        Allocated Ledger Items
                    </h3>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Item</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Paid</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {feeItems.map((item) => {
                                    let statusBadge = 'bg-rose-50 text-rose-600 border-rose-100';
                                    if (item.status === 'Paid') {
                                        statusBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                    } else if (item.status === 'Partially Paid') {
                                        statusBadge = 'bg-amber-50 text-amber-600 border-amber-100';
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight text-sm">
                                                {item.feeName}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-500">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                                    {item.feeCode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-slate-800 text-sm">
                                                ${item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 text-sm">
                                                ${item.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-rose-600 text-sm">
                                                ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-400">
                                                {item.dueDate}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${statusBadge}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
