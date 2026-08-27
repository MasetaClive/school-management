'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Student {
    id: string;
    student_id: string;
    full_name: string;
    class: {
        id: string;
        name: string;
    } | null;
    academic_year: string;
}

interface FeeType {
    id: string;
    name: string;
    code: string;
    category: string;
    amount: number;
    academic_year: string;
}

interface StudentFee {
    id: string;
    student_id: string;
    fee_type_id: string;
    total_amount: number;
    paid_amount: number;
    status: string;
    due_date: string | null;
    academic_year: string;
    fee_type?: {
        name: string;
        description: string;
    };
}

export default function RecordPaymentPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
    
    // Selection states
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudentFeeId, setSelectedStudentFeeId] = useState('');
    
    // Assignment states (fallback utility)
    const [assignFeeTypeId, setAssignFeeTypeId] = useState('');
    const [assignAmount, setAssignAmount] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState('');

    // Payment Form states
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card'>('cash');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    
    // Loading/Success/Error states
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingFees, setLoadingFees] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Load initial student list and fee types on mount
    useEffect(() => {
        async function loadInitialData() {
            try {
                setLoadingStudents(true);
                const [studRes, typesRes] = await Promise.all([
                    fetch('/api/admin/students'),
                    fetch('/api/admin/fees/types')
                ]);

                if (studRes.ok) {
                    const studData = await studRes.json();
                    setStudents(studData.data || []);
                }
                
                if (typesRes.ok) {
                    const typesData = await typesRes.json();
                    setFeeTypes(typesData || []);
                }
            } catch (e) {
                console.error('Failed to load initial data', e);
            } finally {
                setLoadingStudents(false);
            }
        }
        void loadInitialData();
    }, []);

    // Load student assigned fees when student is selected
    useEffect(() => {
        if (!selectedStudentId) {
            setStudentFees([]);
            setSelectedStudentFeeId('');
            return;
        }

        async function loadStudentFees() {
            try {
                setLoadingFees(true);
                setErrorMessage('');
                setSuccessMessage('');
                const res = await fetch(`/api/admin/fees/student/${selectedStudentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudentFees(data || []);
                    if (data && data.length > 0) {
                        setSelectedStudentFeeId(data[0].id);
                    } else {
                        setSelectedStudentFeeId('');
                    }
                }
            } catch (e) {
                console.error('Failed to load student fees', e);
            } finally {
                setLoadingFees(false);
            }
        }
        void loadStudentFees();
    }, [selectedStudentId]);

    // Handle Quick Fee Assignment
    const handleAssignFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !assignFeeTypeId || !assignAmount) return;

        try {
            setIsAssigning(true);
            setErrorMessage('');
            setAssignSuccess('');
            
            const studentObj = students.find(s => s.id === selectedStudentId);

            const res = await fetch('/api/admin/fees/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: selectedStudentId,
                    fee_type_id: assignFeeTypeId,
                    total_amount: Number(assignAmount),
                    academic_year: studentObj?.academic_year || '2026/2027',
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days due date
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || 'Failed to assign fee to student');
                return;
            }

            setAssignSuccess('Fee assigned successfully!');
            setAssignFeeTypeId('');
            setAssignAmount('');

            // Reload student fees
            const feesRes = await fetch(`/api/admin/fees/student/${selectedStudentId}`);
            if (feesRes.ok) {
                const feesData = await feesRes.json();
                setStudentFees(feesData || []);
                const newAssign = feesData.find((f: any) => f.fee_type_id === assignFeeTypeId);
                if (newAssign) setSelectedStudentFeeId(newAssign.id);
                else if (feesData.length > 0) setSelectedStudentFeeId(feesData[0].id);
            }
        } catch (e) {
            setErrorMessage('Network error: Failed to assign fee');
        } finally {
            setIsAssigning(false);
        }
    };

    // Prepopulate amount when assigning fee type dropdown changes
    const handleAssignTypeChange = (val: string) => {
        setAssignFeeTypeId(val);
        const match = feeTypes.find(t => t.id === val);
        if (match) {
            setAssignAmount(match.amount.toString());
        } else {
            setAssignAmount('');
        }
    };

    // Find the currently selected fee account details
    const selectedFee = studentFees.find(f => f.id === selectedStudentFeeId);
    const outstandingBalance = selectedFee ? (Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)) : 0;

    // Handle payment form submit
    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!selectedStudentFeeId) {
            setErrorMessage('Please select a fee account.');
            return;
        }

        const amt = parseFloat(amountPaid);
        if (isNaN(amt) || amt <= 0) {
            setErrorMessage('Please enter a valid positive payment amount.');
            return;
        }

        // Rule: Prevent overpayment according to business rules
        if (amt > outstandingBalance) {
            setErrorMessage(`Payment exceeds outstanding balance. Max allowed: $${outstandingBalance.toFixed(2)}`);
            return;
        }

        try {
            setSubmittingPayment(true);

            // API structure aligns with recordPaymentSchema in backend
            const res = await fetch('/api/admin/fees/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_fee_id: selectedStudentFeeId,
                    amount_paid: amt,
                    payment_method: paymentMethod,
                    reference_number: referenceNumber.trim() || undefined,
                    notes: notes.trim() ? `${notes.trim()} (Paid Date: ${paymentDate})` : `Date: ${paymentDate}`
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || 'Failed to record payment');
                return;
            }

            setSuccessMessage(`Payment of $${amt.toFixed(2)} recorded successfully! Outstanding balance updated.`);
            setAmountPaid('');
            setReferenceNumber('');
            setNotes('');

            // Reload student fees to automatically update/recalculate balances
            const feesRes = await fetch(`/api/admin/fees/student/${selectedStudentId}`);
            if (feesRes.ok) {
                const feesData = await feesRes.json();
                setStudentFees(feesData || []);
            }

        } catch (e) {
            setErrorMessage('Network error: Failed to submit payment');
        } finally {
            setSubmittingPayment(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic font-sans">Record Fee Payment</h2>
                <p className="text-slate-500 font-medium">Record collections and update student balances in real-time.</p>
            </div>

            {/* Error & Success indicators */}
            {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-black uppercase tracking-tight relative flex items-center justify-between">
                    <span>⚠️ {errorMessage}</span>
                    <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600 text-sm ml-4 font-black">✕</button>
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-tight relative flex items-center justify-between">
                    <span>✓ {successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-600 text-sm ml-4 font-black">✕</button>
                </div>
            )}

            {/* Select Student Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Student *</label>
                    <select 
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                        disabled={loadingStudents}
                    >
                        <option value="">-- Choose Student --</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.full_name} ({student.student_id}) {student.class ? `- ${student.class.name}` : ''}
                            </option>
                        ))}
                    </select>
                    {loadingStudents && <p className="text-[10px] text-slate-400 animate-pulse font-medium">Loading student directory...</p>}
                </div>
            </div>

            {selectedStudentId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Column: Form (Record Payment) - spans 2 cols on desktop */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* If student has assigned fees, show payment form */}
                        {studentFees.length > 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                <form onSubmit={handleSubmitPayment} className="p-8 space-y-6">
                                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b pb-2">Record Transaction</h3>
                                    
                                    {/* Select applicable fee account */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Fee Account *</label>
                                        <select 
                                            value={selectedStudentFeeId}
                                            onChange={(e) => setSelectedStudentFeeId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors animate-in fade-in"
                                        >
                                            {studentFees.map(fee => (
                                                <option key={fee.id} value={fee.id}>
                                                    {fee.fee_type?.name || 'Assigned Fee'} (${(Number(fee.total_amount) - Number(fee.paid_amount)).toFixed(2)} remaining)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Input Amount & Method */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Amount ($) *</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Method *</label>
                                            <select 
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="card">Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Reference & Date */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Reference / Receipt Number</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. TXN-998877"
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Date *</label>
                                            <input 
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Notes / Remarks</label>
                                        <textarea 
                                            rows={2}
                                            placeholder="Receipt memo or payment confirmation notes..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors resize-none"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button
                                            type="submit"
                                            disabled={submittingPayment}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer shadow-md disabled:opacity-50"
                                        >
                                            {submittingPayment ? 'Saving Transaction...' : 'Save Payment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            /* Fallback fee assignment section if no fees are assigned in DB */
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-6">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b pb-2">Assign Fee Structure</h3>
                                    <p className="text-slate-400 text-[10px] font-medium mt-1">This student has no fee structures assigned in the database. Choose a fee type to allocate first:</p>
                                </div>

                                {assignSuccess && (
                                    <p className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl">{assignSuccess}</p>
                                )}

                                <form onSubmit={handleAssignFee} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Fee Type</label>
                                        <select
                                            value={assignFeeTypeId}
                                            onChange={(e) => handleAssignTypeChange(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            required
                                        >
                                            <option value="">-- Select Fee Type --</option>
                                            {feeTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (${t.amount})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Allocation Amount ($)</label>
                                        <input 
                                            type="number"
                                            value={assignAmount}
                                            onChange={(e) => setAssignAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isAssigning || !assignFeeTypeId}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
                                    >
                                        {isAssigning ? 'Allocating Fee...' : 'Assign Fee to Student'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Account Balance Card - 1 col width */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-6">Account Balance</h3>
                            
                            {loadingFees ? (
                                <p className="text-[10px] text-slate-400 animate-pulse font-medium">Fetching accounts balances...</p>
                            ) : selectedFee ? (
                                <div className="space-y-5">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Account</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                                            {selectedFee.fee_type?.name}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center text-xs border-b pb-2.5">
                                        <span className="font-bold text-slate-400 uppercase tracking-tight">Total Assigned:</span>
                                        <span className="font-mono font-black text-slate-700">${Number(selectedFee.total_amount).toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs border-b pb-2.5">
                                        <span className="font-bold text-slate-400 uppercase tracking-tight">Total Paid:</span>
                                        <span className="font-mono font-black text-emerald-600">${Number(selectedFee.paid_amount).toFixed(2)}</span>
                                    </div>

                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <p className="text-[8px] font-black text-rose-700 uppercase tracking-wider">Outstanding Balance</p>
                                            <p className="font-mono font-black text-rose-800 text-lg mt-0.5">${outstandingBalance.toFixed(2)}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-200 text-rose-800 border border-rose-300">
                                            {selectedFee.status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium italic text-center py-4">No active fee account selected.</p>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
