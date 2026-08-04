'use client';

import { useEffect, useState } from 'react';

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: string;
  remarks: string | null;
  student_id: string;
  student: { id: string; full_name: string; student_id: string } | null;
};

export default function ParentAttendancePage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/parent/attendance');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load attendance');
        setData(json.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading attendance...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance</h2>
        <p className="text-sm text-muted-foreground">Attendance for your linked children</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && data.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No attendance records are available for your children yet.
        </div>
      )}

      {!error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((record) => (
            <div key={record.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{record.student?.full_name || 'Student'}</p>
                  <p className="text-sm text-muted-foreground">{record.student?.student_id || ''}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{new Date(record.attendance_date).toLocaleDateString()}</p>
                  <p className="font-medium text-foreground">{record.status}</p>
                </div>
              </div>
              {record.remarks && <p className="mt-3 text-sm">{record.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
