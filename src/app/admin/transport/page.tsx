'use client';

import { useEffect, useState } from 'react';

type Route = {
    id: string;
    name: string;
    vehicle_number: string;
    driver_name: string;
    driver_phone: string;
    capacity: number;
    fee: number;
};

type Assignment = {
    id: string;
    student: { full_name: string; student_id: string; class: { name: string } };
    route: { name: string; vehicle_number: string; driver_name: string };
    pickup_point: string;
    academic_year: string;
};

export default function TransportManagementPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Assignment Form State
    const [studentId, setStudentId] = useState('');
    const [routeId, setRouteId] = useState('');
    const [pickup, setPickup] = useState('');
    const [year, setYear] = useState('2023-2024');
    const [saving, setSaving] = useState(false);

    // Route Form State
    const [routeName, setRouteName] = useState('');
    const [vehicleNum, setVehicleNum] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [capacity, setCapacity] = useState(40);
    const [fee, setFee] = useState(0);
    const [creatingRoute, setCreatingRoute] = useState(false);

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
            setRoutes(Array.isArray(rData) ? rData : []);
            setAssignments(Array.isArray(aData) ? aData : []);
        } catch (e) {
            console.error('Failed to load transport data', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateRoute(e: React.FormEvent) {
        e.preventDefault();
        if (!routeName || !vehicleNum) return alert('Route name and Vehicle number are required');

        try {
            setCreatingRoute(true);
            const res = await fetch('/api/admin/transport/routes', {
                method: 'POST',
                body: JSON.stringify({ 
                    name: routeName, 
                    vehicle_number: vehicleNum, 
                    driver_name: driverName,
                    driver_phone: driverPhone,
                    capacity,
                    fee
                })
            });
            if (res.ok) {
                alert('Route created successfully');
                setRouteName('');
                setVehicleNum('');
                setDriverName('');
                setDriverPhone('');
                void load();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create route');
            }
        } finally {
            setCreatingRoute(false);
        }
    }

    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        if (studentSearch.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                void searchStudents();
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [studentSearch]);

    async function searchStudents() {
        try {
            const res = await fetch(`/api/admin/students?search=${encodeURIComponent(studentSearch)}`);
            const data = await res.json();
            setSearchResults(data.data || []);
        } catch (e) {
            console.error('Search failed', e);
        }
    }

    async function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedStudent || !routeId) return alert('Please select student and route');
        
        try {
            setSaving(true);
            const res = await fetch('/api/admin/transport/assignments', {
                method: 'POST',
                body: JSON.stringify({ 
                    student_id: selectedStudent.id, 
                    route_id: routeId, 
                    details: { pickup_point: pickup, academic_year: year } 
                })
            });
            if (res.ok) {
                alert('Student assigned successfully');
                setSelectedStudent(null);
                setStudentSearch('');
                setPickup('');
                void load();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to assign student');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Logistics & Transport</h2>
                    <p className="text-slate-500 font-medium font-sans">Manage school routes, bus assignments, and student transport.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Assign Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Add Route Form */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Add New Route</h3>
                        <form onSubmit={handleCreateRoute} className="space-y-3">
                            <input className="w-full border p-2 rounded-xl text-xs" placeholder="Route Name" value={routeName} onChange={e => setRouteName(e.target.value)} />
                            <input className="w-full border p-2 rounded-xl text-xs" placeholder="Vehicle Number" value={vehicleNum} onChange={e => setVehicleNum(e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <input className="w-full border p-2 rounded-xl text-xs" placeholder="Driver Name" value={driverName} onChange={e => setDriverName(e.target.value)} />
                                <input className="w-full border p-2 rounded-xl text-xs" placeholder="Phone" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" className="w-full border p-2 rounded-xl text-xs" placeholder="Capacity" value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
                                <input type="number" className="w-full border p-2 rounded-xl text-xs" placeholder="Fee ($)" value={fee} onChange={e => setFee(Number(e.target.value))} />
                            </div>
                            <button 
                                type="submit" 
                                disabled={creatingRoute}
                                className="w-full py-2 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-colors"
                            >
                                {creatingRoute ? 'Creating...' : '+ Create Route'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Assign Student</h3>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-black uppercase text-slate-400">Search Student Name</label>
                                {selectedStudent ? (
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                                        <div>
                                            <p className="text-xs font-black text-indigo-900">{selectedStudent.full_name}</p>
                                            <p className="text-[10px] text-indigo-500 font-medium">{selectedStudent.student_id}</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedStudent(null)}
                                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            className="w-full border p-2 rounded-xl text-sm" 
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            placeholder="Type name (min 3 chars)..."
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                                {searchResults.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setSearchResults([]);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors border-b last:border-0"
                                                    >
                                                        <p className="text-xs font-black text-slate-800">{s.full_name}</p>
                                                        <p className="text-[10px] text-slate-400">{s.student_id}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Select Route</label>
                                <select 
                                    className="w-full border p-2 rounded-xl text-sm font-bold"
                                    value={routeId}
                                    onChange={e => setRouteId(e.target.value)}
                                >
                                    <option value="">Select a route...</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.vehicle_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Pickup Point</label>
                                <input 
                                    className="w-full border p-2 rounded-xl text-sm" 
                                    value={pickup}
                                    onChange={e => setPickup(e.target.value)}
                                    placeholder="Enter stop name"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={saving || !selectedStudent}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Processing...' : 'Confirm Assignment'}
                            </button>
                        </form>
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Overview</h4>
                            <span className="text-emerald-500 animate-pulse text-lg">●</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Routes</p>
                                <p className="text-2xl font-black mt-1">{routes.length}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Assigned</p>
                                <p className="text-2xl font-black mt-1">{assignments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Routes and Assignments Tables */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Routes List */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Available Routes</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Route Name</th>
                                        <th className="px-6 py-3 text-left">Vehicle #</th>
                                        <th className="px-6 py-3 text-left">Driver</th>
                                        <th className="px-6 py-3 text-right">Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {routes.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-black text-slate-700">{r.name}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{r.vehicle_number}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold">{r.driver_name}</p>
                                                <p className="text-[10px] text-slate-400">{r.driver_phone}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-emerald-600">${r.fee}</td>
                                        </tr>
                                    ))}
                                    {routes.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No routes found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Active Assignments */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Student Assignments</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Student</th>
                                        <th className="px-6 py-3 text-left">Route</th>
                                        <th className="px-6 py-3 text-left">Stop</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {assignments.map(a => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-700 uppercase tracking-tight">{a.student.full_name}</p>
                                                <p className="text-[10px] text-slate-400">Class: {a.student.class?.name}</p>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-indigo-600">{a.route.name}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">{a.pickup_point}</td>
                                        </tr>
                                    ))}
                                    {assignments.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No student assignments found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
