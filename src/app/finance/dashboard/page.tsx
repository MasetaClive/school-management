'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';

// Mock transaction data
const recentPayments = [
    { receipt: 'REC-2026-0801', student: 'Sarah Jenkins', class: 'Grade 10-A', amount: 1200, method: 'Bank Transfer', date: '2026-08-06', status: 'Success' },
    { receipt: 'REC-2026-0802', student: 'Michael Chang', class: 'Grade 11-B', amount: 450, method: 'Cash', date: '2026-08-06', status: 'Success' },
    { receipt: 'REC-2026-0803', student: 'Amara Okafor', class: 'Grade 9-A', amount: 800, method: 'Card', date: '2026-08-05', status: 'Success' },
    { receipt: 'REC-2026-0804', student: 'David Miller', class: 'Grade 12-A', amount: 1500, method: 'Bank Transfer', date: '2026-08-05', status: 'Success' },
    { receipt: 'REC-2026-0805', student: 'Sofia Rodriguez', class: 'Grade 8-C', amount: 350, method: 'M-Pesa', date: '2026-08-04', status: 'Success' },
];

// Mock outstanding fees data
const outstandingFees = [
    { student: 'James Wilson', class: 'Grade 11-A', amountOwing: 950, lastPayment: '2026-05-10', daysOverdue: 88 },
    { student: 'Emily Watson', class: 'Grade 12-B', amountOwing: 1200, lastPayment: '2026-06-01', daysOverdue: 66 },
    { student: 'Lucas Silva', class: 'Grade 10-B', amountOwing: 400, lastPayment: '2026-06-15', daysOverdue: 52 },
    { student: 'Aisha Al-Sayed', class: 'Grade 9-C', amountOwing: 300, lastPayment: '2026-07-02', daysOverdue: 35 },
    { student: 'Noah Tanaka', class: 'Grade 8-A', amountOwing: 150, lastPayment: '2026-07-20', daysOverdue: 17 },
];

const ActionCard = ({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) => (
    <Link href={href} className="group relative p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-800 text-sm group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">{title}</h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">{description}</p>
        </div>
        <span className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all mr-2">→</span>
    </Link>
);

export default function FinanceDashboardPage() {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const formattedDate = new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        setCurrentDate(formattedDate);
    }, []);

    const quickActions = [
        { title: 'Record Payment', href: '#record-payment', icon: '💵', description: 'Log a new student fee receipt' },
        { title: 'Assign Fees', href: '#assign-fees', icon: '📝', description: 'Allocate structures to classes' },
        { title: 'Fee Types', href: '#fee-types', icon: '🏷️', description: 'Create and edit fee categories' },
        { title: 'Student Accounts', href: '#student-accounts', icon: '👥', description: 'View ledgers and balances' },
        { title: 'Receipts', href: '#receipts', icon: '🧾', description: 'Search and reprint payments' },
        { title: 'Reports', href: '#reports', icon: '📈', description: 'Income & overdue summaries' },
    ];

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500">
            {/* Header: Title, Academic Year, Date */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-white to-indigo-50/20 -z-10" />
                <div className="space-y-2 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none border border-emerald-100 px-2.5 py-1 rounded-full bg-emerald-50/50 inline-block">
                        Finance Control Center
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase italic">
                        Antigravity Finance
                    </h2>
                    <p className="text-xs text-slate-500 font-sans font-medium">
                        Academic Year: <span className="font-bold text-slate-700">2026/2027</span>
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center md:text-right min-w-[200px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Session Date</p>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {currentDate || 'Loading System Date...'}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                <StatCard 
                    title="Expected Fees" 
                    value="$250,000" 
                    icon={<span>📊</span>} 
                    color="indigo"
                    description="Total term allocations"
                />
                <StatCard 
                    title="Collected Fees" 
                    value="$185,000" 
                    icon={<span>✓</span>} 
                    color="green"
                    description="Cleared transactions"
                />
                <StatCard 
                    title="Outstanding Balance" 
                    value="$65,000" 
                    icon={<span>⚠️</span>} 
                    color="red"
                    description="Remaining arrears"
                />
                <StatCard 
                    title="Arrears Accounts" 
                    value="42" 
                    icon={<span>👥</span>} 
                    color="orange"
                    description="Students owing fees"
                />
                <StatCard 
                    title="Payments Today" 
                    value="$8,450" 
                    icon={<span>💵</span>} 
                    color="blue"
                    description="Receipts processed today"
                />
                <StatCard 
                    title="Collection Rate" 
                    value="74.0%" 
                    icon={<span>📈</span>} 
                    color="green"
                    description="Expected vs collected"
                />
            </div>

            {/* Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1 & 2: Primary Panels & Monthly Chart */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Monthly Collections Chart Placeholder */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                📈 Monthly Collections Trend
                            </h3>
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                Termly Overview
                            </span>
                        </div>
                        
                        {/* Premium SVG Area/Line Chart Mockup */}
                        <div className="h-64 w-full relative flex flex-col justify-end">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-full border-t border-slate-100/80 h-px" />
                                ))}
                            </div>
                            <svg className="w-full h-48 overflow-visible z-10" viewBox="0 0 600 200" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <path d="M 0 50 L 600 50 M 0 100 L 600 100 M 0 150 L 600 150" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                                {/* Area fill */}
                                <path d="M 0 180 Q 75 140 150 160 T 300 90 T 450 110 T 600 40 L 600 200 L 0 200 Z" fill="url(#chartGradient)" />
                                {/* Line */}
                                <path d="M 0 180 Q 75 140 150 160 T 300 90 T 450 110 T 600 40" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                                {/* Data points with pulse */}
                                <circle cx="150" cy="160" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                                <circle cx="300" cy="90" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                                <circle cx="450" cy="110" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                                <circle cx="600" cy="40" r="6" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
                            </svg>
                            
                            {/* X-Axis labels */}
                            <div className="flex justify-between items-center px-2 pt-4 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                <span>Jan</span>
                                <span>Feb</span>
                                <span>Mar</span>
                                <span>Apr</span>
                                <span>May</span>
                                <span>Jun</span>
                                <span>Jul</span>
                                <span>Aug</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Payments Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                🧾 Recent Payments
                            </h3>
                            <button className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:underline">
                                View All Receipts
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="min-w-full divide-y divide-slate-100 text-xs">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {recentPayments.map((payment) => (
                                            <tr key={payment.receipt} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-500">#{payment.receipt}</td>
                                                <td className="px-4 py-3 font-black text-slate-800 uppercase tracking-tight">{payment.student}</td>
                                                <td className="px-4 py-3 font-bold text-slate-500">{payment.class}</td>
                                                <td className="px-4 py-3 text-right font-mono font-black text-slate-800">${payment.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">{payment.method}</td>
                                                <td className="px-4 py-3 font-medium text-slate-400">{payment.date}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Fees Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                ⚠️ Outstanding Balances
                            </h3>
                            <button className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-700 hover:underline">
                                View Arrears List
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="min-w-full divide-y divide-slate-100 text-xs">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Owing</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Last Payment</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Days Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {outstandingFees.map((fee) => {
                                            let badgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
                                            if (fee.daysOverdue < 30) {
                                                badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                                            } else if (fee.daysOverdue < 60) {
                                                badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
                                            }

                                            return (
                                                <tr key={fee.student} className="hover:bg-slate-50/40 transition-colors">
                                                    <td className="px-4 py-3 font-black text-slate-800 uppercase tracking-tight">{fee.student}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-500">{fee.class}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-black text-rose-600">${fee.amountOwing.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-400">{fee.lastPayment}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                            {fee.daysOverdue} Days
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

                {/* Column 3: Quick Actions, Fees by Class, and Payment Methods */}
                <div className="space-y-8">
                    
                    {/* Quick Actions Panel */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50">
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-6 flex items-center gap-2">
                            ⚡ Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {quickActions.map((action) => (
                                <ActionCard 
                                    key={action.title} 
                                    href={action.href} 
                                    icon={action.icon} 
                                    title={action.title} 
                                    description={action.description} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Outstanding Fees by Class Placeholder */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50">
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-6 flex items-center gap-2">
                            🏫 Arrears by Class
                        </h3>
                        
                        <div className="space-y-4">
                            {[
                                { name: 'Grade 12', amount: 24500, percentage: 82, color: 'bg-rose-500' },
                                { name: 'Grade 11', amount: 18200, percentage: 60, color: 'bg-rose-400' },
                                { name: 'Grade 10', amount: 12400, percentage: 41, color: 'bg-amber-400' },
                                { name: 'Grade 9', amount: 7800, percentage: 26, color: 'bg-indigo-400' },
                                { name: 'Grade 8', amount: 2100, percentage: 7, color: 'bg-emerald-400' },
                            ].map((item) => (
                                <div key={item.name} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-tight">
                                        <span>{item.name}</span>
                                        <span>${item.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Methods Placeholder */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50">
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-6 flex items-center gap-2">
                            💳 Payment Methods
                        </h3>
                        
                        <div className="flex items-center gap-6">
                            {/* Premium SVG Donut Chart Mockup */}
                            <div className="w-28 h-28 shrink-0 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                                    {/* M-Pesa segment (45%) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="113.0" />
                                    {/* Bank Transfer segment (35%) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366F1" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="201.0" transform="rotate(162 50 50)" />
                                    {/* Card segment (15%) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="213.5" transform="rotate(288 50 50)" />
                                    {/* Cash segment (5%) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="238.6" transform="rotate(342 50 50)" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                                    <span className="text-xs font-black text-slate-800">$185k</span>
                                </div>
                            </div>

                            {/* Chart Legend */}
                            <div className="space-y-2 text-[10px] font-black text-slate-500 uppercase tracking-wider w-full">
                                {[
                                    { name: 'M-Pesa', percentage: '45%', color: 'bg-emerald-500' },
                                    { name: 'Bank Trans.', percentage: '35%', color: 'bg-indigo-500' },
                                    { name: 'Card', percentage: '15%', color: 'bg-blue-500' },
                                    { name: 'Cash', percentage: '5%', color: 'bg-amber-500' },
                                ].map((legend) => (
                                    <div key={legend.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${legend.color}`} />
                                            <span>{legend.name}</span>
                                        </div>
                                        <span className="text-slate-700 font-bold">{legend.percentage}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
