'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Stats = {
    classCount: number;
    homeworkCount: number;
    schedule: Array<{
        id: string;
        class: { name: string } | null;
        subject: { name: string; code: string } | null;
        time_slot: { start_time: string; end_time: string; day_of_week: number } | null;
    }>;
};

type TeacherInfo = {
    id: string;
    teacher_id: string;
    full_name: string;
    email: string;
    phone: string;
    qualification: string;
};

type AssignedClass = {
    id: string;
    name: string;
    academic_year: string;
};

type AttendanceRecord = {
    id: string;
    full_name: string;
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks: string;
};

export default function TeacherDashboardPage() {
    // Teacher & Dashboard Stats States
    const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
    
    // Core Loading/Error States
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // Attendance Widget States
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [attendanceDate, setAttendanceDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [students, setStudents] = useState<AttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);
    const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);
    const [submittingAttendance, setSubmittingAttendance] = useState(false);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoadingDashboard(true);
                const [profRes, statsRes, classesRes] = await Promise.all([
                    fetch('/api/teacher/profile'),
                    fetch('/api/teacher/dashboard/stats'),
                    fetch('/api/teacher/classes')
                ]);

                if (!profRes.ok) throw new Error('Failed to load teacher profile');
                if (!statsRes.ok) throw new Error('Failed to load dashboard statistics');
                if (!classesRes.ok) throw new Error('Failed to load assigned classes');

                const profJson = await profRes.json();
                const statsJson = await statsRes.json();
                const classesJson = await classesRes.json();

                setTeacher(profJson.teacher);
                setStats(statsJson);
                
                const classesList = classesJson.data || [];
                setAssignedClasses(classesList);

                // Auto-select the first class for the attendance widget
                if (classesList.length > 0) {
                    setSelectedClassId(classesList[0].id);
                }
            } catch (e: any) {
                setDashboardError(e.message || 'An unexpected error occurred while loading');
            } finally {
                setLoadingDashboard(false);
            }
        }
        void loadDashboardData();
    }, []);

    // Fetch students attendance when class or date changes
    useEffect(() => {
        if (!selectedClassId || !attendanceDate) return;

        async function loadClassAttendance() {
            try {
                setLoadingAttendance(true);
                setAttendanceError(null);
                setAttendanceSuccess(null);
                const res = await fetch(`/api/teacher/attendance?class_id=${selectedClassId}&date=${attendanceDate}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load attendance');
                setStudents(json.data || []);
            } catch (err: any) {
                setAttendanceError(err.message || 'Failed to load class students');
                setStudents([]);
            } finally {
                setLoadingAttendance(false);
            }
        }

        void loadClassAttendance();
    }, [selectedClassId, attendanceDate]);

    // Handle single student attendance state change
    const updateStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    };

    const updateStudentRemarks = (studentId: string, remarks: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s));
    };

    // Submit batch attendance
    const handleSubmitAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId || !attendanceDate) return;

        try {
            setSubmittingAttendance(true);
            setAttendanceError(null);
            setAttendanceSuccess(null);

            const payload = {
                class_id: selectedClassId,
                date: attendanceDate,
                records: students.map(s => ({
                    student_id: s.id,
                    status: s.status,
                    remarks: s.remarks || null
                }))
            };

            const res = await fetch('/api/teacher/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to save attendance');

            setAttendanceSuccess('Attendance records successfully updated!');
        } catch (err: any) {
            setAttendanceError(err.message || 'Failed to submit attendance');
        } finally {
            setSubmittingAttendance(false);
        }
    };

    if (loadingDashboard) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Workspace...</p>
                </div>
            </div>
        );
    }

    if (dashboardError) {
        return (
            <div className="max-w-2xl mx-auto my-12 p-8 border border-red-200 bg-red-50 rounded-3xl text-center">
                <p className="text-red-700 font-bold text-lg mb-2">Error Loading Dashboard</p>
                <p className="text-red-600 text-sm mb-6">{dashboardError}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 transition-all shadow-md">
                    Retry Connection
                </button>
            </div>
        );
    }

    // Process timetable: Filter out nulls, deduplicate, sort chronologically
    const rawTimetable = stats?.schedule || [];
    const validTimetable = rawTimetable.filter(
        entry => entry && entry.class && entry.subject && entry.time_slot
    );
    const seenLessons = new Set<string>();
    const uniqueTimetable = validTimetable.filter(entry => {
        const key = `${entry.time_slot!.start_time}-${entry.time_slot!.end_time}-${entry.class!.name}-${entry.subject!.code}`;
        if (seenLessons.has(key)) return false;
        seenLessons.add(key);
        return true;
    });
    const sortedTimetable = uniqueTimetable.sort((a, b) => {
        return (a.time_slot!.start_time || '').localeCompare(b.time_slot!.start_time || '');
    });

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
            
            {/* Header: Welcome & Profile Details */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-emerald-50/30 -z-10" />
                <div className="space-y-2 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest leading-none border border-indigo-100 px-2.5 py-1 rounded-full bg-indigo-50/50 inline-block">
                        Active Workspace
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase italic">
                        Welcome back, {teacher?.full_name || 'Faculty Member'}!
                    </h2>
                    <p className="text-xs text-slate-500 font-sans font-medium">
                        ID: <span className="font-bold font-mono text-slate-700">#{teacher?.teacher_id}</span> | 
                        Qualification: <span className="font-bold text-slate-700">{teacher?.qualification || 'N/A'}</span>
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Classes</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.classCount ?? 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Homework</p>
                        <p className="text-2xl font-black text-indigo-600">{stats?.homeworkCount ?? 0}</p>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1 & 2: Timetable and Attendance */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Today's Timetable */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                📅 Today's Timetable
                            </h3>
                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
                            </span>
                        </div>
                        <div className="p-6">
                            {sortedTimetable.length === 0 ? (
                                <p className="text-sm text-slate-400 font-medium text-center py-8">No lessons scheduled for today.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sortedTimetable.map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-indigo-200 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl font-mono text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    {entry.time_slot?.start_time.slice(0, 5)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs text-slate-800 uppercase tracking-tight">{entry.subject?.name}</p>
                                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{entry.class?.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 font-mono">
                                                ends {entry.time_slot?.end_time.slice(0, 5)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Marking Component */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                📝 Mark Class Attendance
                            </h3>
                            
                            {/* Attendance Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                <select 
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black uppercase text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                                >
                                    {assignedClasses.length === 0 && <option value="">No classes</option>}
                                    {assignedClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <input 
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black uppercase text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingAttendance ? (
                                <p className="text-sm text-slate-400 font-medium text-center py-8 animate-pulse">Loading class students...</p>
                            ) : attendanceError ? (
                                <p className="text-sm text-red-600 font-medium text-center py-8">{attendanceError}</p>
                            ) : students.length === 0 ? (
                                <p className="text-sm text-slate-400 font-medium text-center py-8">Select a class to mark student attendance.</p>
                            ) : (
                                <form onSubmit={handleSubmitAttendance} className="space-y-6">
                                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student ID</th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Status</th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks (Optional)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 bg-white">
                                                {students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-500">#{student.student_id}</td>
                                                        <td className="px-4 py-3 font-black text-slate-800 uppercase tracking-tight">{student.full_name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50/50 overflow-hidden">
                                                                {(['present', 'absent', 'late', 'excused'] as const).map((status) => {
                                                                    const isActive = student.status === status;
                                                                    let colorClasses = '';
                                                                    if (isActive) {
                                                                        if (status === 'present') colorClasses = 'bg-emerald-600 text-white shadow-sm';
                                                                        else if (status === 'absent') colorClasses = 'bg-rose-600 text-white shadow-sm';
                                                                        else if (status === 'late') colorClasses = 'bg-amber-500 text-white shadow-sm';
                                                                        else if (status === 'excused') colorClasses = 'bg-indigo-600 text-white shadow-sm';
                                                                    } else {
                                                                        colorClasses = 'text-slate-400 hover:bg-slate-100 hover:text-slate-700';
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={status}
                                                                            type="button"
                                                                            onClick={() => updateStudentStatus(student.id, status)}
                                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 ${colorClasses}`}
                                                                        >
                                                                            {status}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Doctor's note"
                                                                value={student.remarks}
                                                                onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                                                                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {attendanceSuccess && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-tight text-center">
                                            ✓ {attendanceSuccess}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={submittingAttendance}
                                            className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-600 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-indigo-100"
                                        >
                                            {submittingAttendance ? 'Saving Attendance...' : 'Submit Attendance Roll'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 3: Side Widgets (Assigned Classes, Homework Actions) */}
                <div className="space-y-8">
                    
                    {/* Assigned Classes */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50">
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-6 flex items-center gap-2">
                            🏫 Assigned Classes
                        </h3>
                        {assignedClasses.length === 0 ? (
                            <p className="text-sm text-slate-400 font-medium py-4 text-center">No assigned classes found.</p>
                        ) : (
                            <div className="space-y-3">
                                {assignedClasses.map((cls) => (
                                    <div key={cls.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                                                🎓
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{cls.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{cls.academic_year}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Homework Actions / Active homework list */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-slate-200/50 space-y-6">
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
                            ✍️ Homework Management
                        </h3>
                        
                        <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-center space-y-2">
                            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Active Assignments</p>
                            <p className="text-3xl font-black text-indigo-600">{stats?.homeworkCount ?? 0}</p>
                        </div>

                        <div className="space-y-3">
                            <Link 
                                href="/teacher/homework"
                                className="block w-full py-4 bg-slate-900 text-white rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                View Assignments
                            </Link>
                            <Link 
                                href="/teacher/homework/create"
                                className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors"
                            >
                                Create New Homework
                            </Link>
                            <Link href="/teacher/timetable" className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors">My Timetable</Link>
                            <Link href="/teacher/attendance" className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors">Attendance</Link>
                            <Link href="/teacher/exams" className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors">My Exams</Link>
                            <Link href="/teacher/results" className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors">Results</Link>
                            <Link href="/teacher/profile" className="block w-full py-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors">My Profile</Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
