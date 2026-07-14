'use client';

import { useEffect, useState } from 'react';

type Student = {
    id: string;
    full_name: string;
    student_id: string;
    class: { id: string; name: string; academic_year: string };
};

type Class = { id: string; name: string; academic_year: string };

export default function AdminRolloverPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [promotions, setPromotions] = useState<Record<string, string>>({}); // student_id -> next_class_id
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const [sRes, cRes] = await Promise.all([
                fetch('/api/admin/rollover'),
                fetch('/api/admin/classes')
            ]);
            
            const sData = await sRes.json();
            const cData = await cRes.json();

            setStudents(Array.isArray(sData) ? sData : []);
            setClasses(Array.isArray(cData) ? cData : []);

            if (!Array.isArray(sData) || !Array.isArray(cData)) {
                console.error('API Error: Expected arrays but got:', { sData, cData });
            }
        } catch (e) {
            console.error('Failed to load rollover data', e);
            setStudents([]);
            setClasses([]);
        } finally {
            setLoading(false);
        }
    }

    async function handlePromote() {
        const promotionArray = Object.entries(promotions).map(([student_id, next_class_id]) => ({
            student_id,
            next_class_id
        }));

        if (promotionArray.length === 0) return alert('No promotions selected');

        if (!confirm(`Are you sure you want to promote ${promotionArray.length} students? This will change their current class.`)) return;

        try {
            setProcessing(true);
            const res = await fetch('/api/admin/rollover', {
                method: 'POST',
                body: JSON.stringify({ promotions: promotionArray })
            });
            if (res.ok) {
                alert('Students promoted successfully');
                setPromotions({});
                void load();
            } else {
                alert('Promotion failed');
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-primary">Academic Rollover</h2>
                    <p className="text-sm text-muted-foreground">Promote students to next class and update academic records</p>
                </div>
                <button 
                    onClick={handlePromote}
                    disabled={processing || Object.keys(promotions).length === 0}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-black uppercase text-sm tracking-widest disabled:opacity-50 shadow-lg hover:bg-red-700 transition"
                >
                    {processing ? 'Processing...' : 'Execute Promotion'}
                </button>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden min-h-[600px]">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Student Name</th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Current Class</th>
                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Promotion To</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {loading && <tr><td colSpan={3} className="p-12 text-center">Loading student records...</td></tr>}
                        {!loading && students.map((student) => (
                            <tr key={student.id} className="hover:bg-muted/30 transition">
                                <td className="px-6 py-4">
                                    <p className="font-bold">{student.full_name}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground">{student.student_id}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                        {student.class.name} ({student.class.academic_year})
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        className="w-full max-w-xs border rounded p-2 text-xs font-bold"
                                        value={promotions[student.id] || ''}
                                        onChange={e => setPromotions({...promotions, [student.id]: e.target.value})}
                                    >
                                        <option value="">Stay in current class / No Action</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.academic_year})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
