import React from 'react';

type StatCardProps = {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'indigo' | 'green' | 'orange' | 'red' | 'blue';
};

const colorClasses = {
    indigo: 'from-indigo-500 to-blue-600 shadow-indigo-200',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-200',
    orange: 'from-amber-500 to-orange-600 shadow-amber-200',
    red: 'from-rose-500 to-red-600 shadow-rose-200',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-200'
};

export default function StatCard({ title, value, description, icon, trend, color = 'indigo' }: StatCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-300/50 border border-slate-100">
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg w-fit transition-transform group-hover:scale-110`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
                    </div>
                </div>
                {trend && (
                    <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            {description && (
                <p className="mt-4 text-xs font-medium text-slate-400 border-t pt-4">
                    {description}
                </p>
            )}
            
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] grayscale transition-all group-hover:opacity-[0.08] group-hover:scale-110">
                {icon}
            </div>
        </div>
    );
}
