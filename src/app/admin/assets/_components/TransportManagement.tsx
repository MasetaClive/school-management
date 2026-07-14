'use client';

import { useEffect, useState } from 'react';

type Route = { id: string; name: string; vehicle_number: string; driver_name: string; monthly_fee: number };
type Assignment = { 
    id: string; 
    student: { full_name: string; student_id: string; class: { name: string } };
    route: { name: string; vehicle_number: string };
    pickup_point: string;
};

export default function TransportManagement() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const [rRes, aRes] = await Promise.all([
                fetch('/api/admin/transport/routes'),
                fetch('/api/admin/transport/assignments')
            ]);
            const rData = await rRes.json();
            const aData = await aRes.json();
            setRoutes(rData);
            setAssignments(aData);
        } catch (e) {
            console.error('Failed to load transport data');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Transport Logistics</h3>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Add Route</button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase text-muted-foreground tracking-widest">Active Routes</h4>
                    <div className="space-y-3">
                        {routes.map(r => (
                            <div key={r.id} className="p-4 border rounded-lg bg-muted/10 flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{r.name}</p>
                                    <p className="text-xs text-muted-foreground">{r.vehicle_number} - {r.driver_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold">${r.monthly_fee}/mo</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase text-muted-foreground tracking-widest">Student Assignments</h4>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase">Student</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase">Route</th>
                                    <th className="px-4 py-2 text-right text-[10px] font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {assignments.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-xs">{a.student.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{a.student.class.name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-xs">{a.route.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{a.pickup_point}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-primary hover:underline text-[10px] font-bold">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {assignments.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground text-xs italic">No transport assignments yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
