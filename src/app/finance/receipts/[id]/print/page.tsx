'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PaymentDetail {
    id: string;
    receiptNumber: string;
    studentName: string;
    studentId: string;
    gradeClass: string;
    academicYear: string;
    term: string;
    feeName: string;
    amountPaid: number;
    paymentMethod: string;
    referenceNumber: string;
    previousBalance: number;
    remainingBalance: number;
    paymentDate: string;
    notes: string;
}

// Mock payments copy to allow standalone receipt generation
const mockPayments: Record<string, PaymentDetail> = {
    'pay-101': {
        id: 'pay-101',
        receiptNumber: 'REC-2026-000101',
        studentName: 'Sarah Jenkins',
        studentId: 'STU-001',
        gradeClass: 'Grade 10',
        academicYear: '2026-2027',
        term: 'Term 1',
        feeName: 'Tuition Fee - Grade 10',
        amountPaid: 1200,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'TXN-998877',
        previousBalance: 1800,
        remainingBalance: 600,
        paymentDate: '2026-08-06',
        notes: 'Paid Term 1 Tuition Fee'
    },
    'pay-102': {
        id: 'pay-102',
        receiptNumber: 'REC-2026-000102',
        studentName: 'Michael Chang',
        studentId: 'STU-002',
        gradeClass: 'Grade 10',
        academicYear: '2026-2027',
        term: 'Term 1',
        feeName: 'Bus Transport - Route A',
        amountPaid: 450,
        paymentMethod: 'Cash',
        referenceNumber: 'CSH-00234',
        previousBalance: 450,
        remainingBalance: 0,
        paymentDate: '2026-08-06',
        notes: 'Bus transport cash receipt'
    },
    'pay-103': {
        id: 'pay-103',
        receiptNumber: 'REC-2026-000103',
        studentName: 'David Miller',
        studentId: 'STU-004',
        gradeClass: 'Grade 11',
        academicYear: '2026-2027',
        term: 'Term 1',
        feeName: 'Tuition Fee - Grade 10',
        amountPaid: 1500,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'TXN-998855',
        previousBalance: 1500,
        remainingBalance: 0,
        paymentDate: '2026-08-05',
        notes: 'Paid Term 1 Tuition Fee'
    },
    'pay-104': {
        id: 'pay-104',
        receiptNumber: 'REC-2026-000104',
        studentName: 'Amara Okafor',
        studentId: 'STU-003',
        gradeClass: 'Grade 10',
        academicYear: '2026-2027',
        term: 'Term 1',
        feeName: 'Science Lab Material Fee',
        amountPaid: 800,
        paymentMethod: 'Card',
        referenceNumber: 'CRD-45903',
        previousBalance: 950,
        remainingBalance: 150,
        paymentDate: '2026-08-05',
        notes: 'Lab fee and sports kit card payment'
    },
    'pay-105': {
        id: 'pay-105',
        receiptNumber: 'REC-2026-000105',
        studentName: 'Sofia Rodriguez',
        studentId: 'STU-005',
        gradeClass: 'Grade 10',
        academicYear: '2026-2027',
        term: 'Term 1',
        feeName: 'Bus Transport - Route A',
        amountPaid: 350,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'TXN-998844',
        previousBalance: 500,
        remainingBalance: 150,
        paymentDate: '2026-08-04',
        notes: 'Bus transport payment'
    }
};

export default function PrintReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createClient();
    const { id } = use(params);

    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchPaymentReceipt() {
            try {
                setLoading(true);

                // Check if mock payment
                if (id && id.startsWith('pay-')) {
                    const match = mockPayments[id];
                    if (match) {
                        setPayment(match);
                    } else {
                        setNotFound(true);
                    }
                    return;
                }

                // Query DB payment
                const { data: dbPay, error: payError } = await supabase
                    .from('fee_payments')
                    .select(`
                        id,
                        amount_paid,
                        payment_date,
                        payment_method,
                        reference_number,
                        notes,
                        created_at,
                        student_fee:student_fees(
                            id,
                            total_amount,
                            paid_amount,
                            status,
                            academic_year,
                            student:students(
                                id,
                                student_id,
                                full_name,
                                class:classes(name)
                            ),
                            fee_type:fee_types(name)
                        )
                    `)
                    .eq('id', id)
                    .maybeSingle();

                if (payError || !dbPay) {
                    setNotFound(true);
                    return;
                }

                const payObj: any = dbPay;
                const studentFeeObj = payObj.student_fee || {};
                const studentObj = studentFeeObj.student || {};
                const classObj = studentObj.class || {};
                const feeTypeObj = studentFeeObj.fee_type || {};

                const amtPaid = Number(payObj.amount_paid);
                const totalAmt = Number(studentFeeObj.total_amount);
                const paidAmt = Number(studentFeeObj.paid_amount);

                // Calculate balances
                const remaining = totalAmt - paidAmt;
                const previous = remaining + amtPaid;

                setPayment({
                    id: payObj.id,
                    receiptNumber: `REC-${payObj.id.slice(0, 8).toUpperCase()}`,
                    studentName: studentObj.full_name || 'Unknown Student',
                    studentId: studentObj.student_id || 'N/A',
                    gradeClass: classObj.name || 'Unassigned',
                    academicYear: studentFeeObj.academic_year || '2026/2027',
                    term: 'Term 1',
                    feeName: feeTypeObj.name || 'Assigned Fee',
                    amountPaid: amtPaid,
                    paymentMethod: payObj.payment_method || 'N/A',
                    referenceNumber: payObj.reference_number || 'N/A',
                    previousBalance: previous,
                    remainingBalance: remaining,
                    paymentDate: payObj.payment_date || 'N/A',
                    notes: payObj.notes || ''
                });

            } catch (e) {
                console.error(e);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        void fetchPaymentReceipt();
    }, [id, supabase]);

    // Automatically trigger browser print dialog once payment record is loaded
    useEffect(() => {
        if (payment) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [payment]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Generating PDF Invoice layout...</p>
            </div>
        );
    }

    if (notFound || !payment) {
        return (
            <div className="max-w-md mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Receipt Record Not Found</p>
                <p className="text-red-600 text-sm">The payment receipt details could not be generated.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans p-6 sm:p-12 max-w-3xl mx-auto shadow-sm relative">
            
            {/* Top Toolbar - hidden in printing */}
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="text-xs">
                    <p className="font-bold text-slate-700">Receipt Ready to Print / Download PDF</p>
                    <p className="text-slate-500">Your browser&apos;s printing dialog should trigger automatically.</p>
                </div>
                <div className="flex gap-2.5">
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                    >
                        🖨️ Print Receipt
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
                
                {/* Receipt Header / School info */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">▲</span>
                            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">Antigravity Academy</h1>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Finance Receipt</p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider space-y-0.5">
                        <p>100 Gravity Way, Silicon Valley</p>
                        <p>Tel: +1 (555) 019-2831</p>
                        <p>Email: finance@antigravity.edu</p>
                    </div>
                </div>

                {/* Sub-header: Receipt No & Date */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-50 p-6 rounded-2xl">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receipt Number</p>
                        <p className="font-mono text-sm font-black text-slate-800 uppercase mt-0.5">{payment.receiptNumber}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Processed</p>
                        <p className="text-sm font-black text-slate-800 uppercase mt-0.5">{payment.paymentDate}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                        <p className="text-sm font-black text-slate-800 uppercase mt-0.5">{payment.paymentMethod}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference / Check</p>
                        <p className="font-mono text-sm font-black text-slate-800 uppercase mt-0.5">{payment.referenceNumber}</p>
                    </div>
                </div>

                {/* Student details block */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1.5">Student Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-700 uppercase tracking-tight">
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 block tracking-wider">Student Name</span>
                            <span className="text-slate-900">{payment.studentName}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 block tracking-wider">Student ID</span>
                            <span className="font-mono text-slate-900">#{payment.studentId}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 block tracking-wider">Class / Level</span>
                            <span className="text-slate-900">{payment.gradeClass}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-slate-400 block tracking-wider">Academic Year</span>
                            <span className="text-slate-900">{payment.academicYear} • {payment.term}</span>
                        </div>
                    </div>
                </div>

                {/* Ledger Item description table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden mt-6">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Allocated Ledger Fee Account</th>
                                <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Previous Balance</th>
                                <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Amount Received</th>
                                <th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Remaining Arrears</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            <tr>
                                <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-tight text-sm">
                                    {payment.feeName}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-black text-slate-700 text-sm">
                                    ${payment.previousBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 text-sm">
                                    ${payment.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-black text-rose-600 text-sm">
                                    ${payment.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Notes box */}
                {payment.notes && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                        <p>{payment.notes}</p>
                    </div>
                )}

                {/* Final Signatures / Acknowledgements */}
                <div className="flex flex-col sm:flex-row justify-between items-end pt-8 border-t gap-8">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <p>Thank you for your payment.</p>
                        <p className="mt-1">Authorized by: Finance Officer</p>
                    </div>
                    
                    <div className="w-48 text-center border-t border-dashed pt-2">
                        <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Authorized Signature</p>
                        <div className="h-8"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}
