'use client';

import { useEffect, useMemo, useState } from 'react';

type AssignedClass = { id: string; name: string; academic_year: string };
type AttendanceRecord = { id: string; full_name: string; student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks: string };

export default function TeacherAttendancePage() {
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/teacher/classes');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load assigned classes');
        const list = json.data || [];
        setAssignedClasses(list);
        if (list.length > 0) setSelectedClassId(list[0].id);
      } catch (e: any) {
        setError(e.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    }
    void loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId || !attendanceDate) return;
    async function loadAttendance() {
      try {
        setError(null);
        setSuccess(null);
        const res = await fetch(`/api/teacher/attendance?class_id=${selectedClassId}&date=${attendanceDate}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load attendance');
        setStudents(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load attendance');
        setStudents([]);
      }
    }
    void loadAttendance();
  }, [selectedClassId, attendanceDate]);

  const updateStudentStatus = (studentId: string, status: AttendanceRecord['status']) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status } : student)));
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, remarks } : student)));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClassId) return;
    try {
      setSaving(true);
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClassId, date: attendanceDate, records: students.map((student) => ({ student_id: student.id, status: student.status, remarks: student.remarks || null })) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save attendance');
      setSuccess('Attendance updated.');
    } catch (e: any) {
      setError(e.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Attendance</h2>
        <p className="text-xs font-medium text-slate-500">Record and review attendance only for classes you teach.</p>
      </div>
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
            {assignedClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-600">{success}</p>}
        {students.length === 0 ? <p className="text-sm text-slate-500">No students found for this class and date.</p> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-800">{student.full_name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{student.student_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                      <button key={status} type="button" onClick={() => updateStudentStatus(student.id, status)} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${student.status === status ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <input value={student.remarks} onChange={(e) => updateStudentRemarks(student.id, e.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Remarks" />
              </div>
            ))}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="rounded-[2rem] bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Attendance'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
