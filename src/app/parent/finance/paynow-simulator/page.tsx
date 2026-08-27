'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SimulatorForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const ref = searchParams.get('ref') || 'N/A';
    const amount = searchParams.get('amount') || '0.00';
    const method = searchParams.get('payment_method') || 'ecocash';
    const email = searchParams.get('email') || 'parent@school.local';

    const [phone, setPhone] = useState('0771234567');
    const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvv, setCardCvv] = useState('123');

    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handlePayment = async (status: 'Paid' | 'Cancelled') => {
        try {
            setProcessing(true);
            setMessage(status === 'Paid' ? 'Authorizing transaction with mobile network...' : 'Cancelling checkout session...');

            // Call our webhook API endpoint directly to simulate Paynow transaction notifications
            const res = await fetch('/api/parent/paynow/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reference: ref,
                    status: status,
                    paynowreference: `SIM-PAY-${Date.now()}`,
                    amount: amount
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error('[Simulator] Webhook dispatch failed:', errData);
            }

            // Redirect back to parent finance dashboard with corresponding status query
            const returnUrl = `/parent/finance?status=${status === 'Paid' ? 'success' : 'cancelled'}&ref=${ref}&amount=${amount}`;
            router.push(returnUrl);
        } catch (e) {
            console.error('[Simulator] Connection error:', e);
            setMessage('Network error: Webhook could not be reached.');
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center border-b pb-5">
                <div className="flex justify-center items-center gap-1.5 mb-2">
                    <span className="h-6 w-6 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">▲</span>
                    <span className="text-sm font-black uppercase text-slate-800 tracking-wider">Paynow Simulator</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase italic">Zimbabwe Gateway Checkout</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Simulating live payment gateway endpoints</p>
            </div>

            {/* Transaction overview */}
            <div className="bg-slate-50 p-6 rounded-2xl space-y-3.5 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Merchant</span>
                    <span className="text-slate-900">Antigravity Academy Fees</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reference</span>
                    <span className="font-mono text-slate-900">{ref}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Payer Account</span>
                    <span className="truncate max-w-[200px] text-slate-900">{email}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-base text-slate-950 font-black">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Amount Due:</span>
                    <span className="font-mono text-emerald-800">${parseFloat(amount).toFixed(2)}</span>
                </div>
            </div>

            {/* Input fields based on method */}
            {method === 'ecocash' ? (
                <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Mobile Wallet</span>
                        <span className="text-xs font-black text-emerald-800 uppercase">EcoCash Zimbabwe</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">EcoCash Mobile Number *</label>
                        <input 
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                            required
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                        <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Credit / Debit Card</span>
                        <span className="text-xs font-black text-blue-800 uppercase">Visa / Mastercard</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Card Number *</label>
                        <input 
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Expiry Date *</label>
                            <input 
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">CVV *</label>
                            <input 
                                type="text"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            {message && (
                <p className="text-xs font-bold text-center text-slate-500 animate-pulse uppercase tracking-tight">{message}</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t">
                <button
                    onClick={() => handlePayment('Paid')}
                    disabled={processing}
                    className="w-full py-4 bg-emerald-600 text-white rounded-3xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                    {processing ? 'Processing payment...' : 'Authorize Checkout'}
                </button>
                
                <button
                    onClick={() => handlePayment('Cancelled')}
                    disabled={processing}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-3xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                    Cancel Transaction
                </button>
            </div>
        </div>
    );
}

export default function PaynowSimulatorPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
                    Initializing Checkout Simulator...
                </div>
            }>
                <SimulatorForm />
            </Suspense>
        </div>
    );
}
