'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ReportCard = {
  student: { name: string; student_id: string; class: string };
  exam: { name: string; date: string | null; academic_year: string | null };
  subjects: Array<{
    subject: string;
    code: string;
    marks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    remarks: string | null;
  }>;
  summary: {
    totalObtained: number;
    totalMax: number;
    overallPercentage: number;
    overallGrade: string;
    passed: boolean | null;
    resultCount: number;
    isComplete: boolean;
  };
};

export default function ParentReportCardsPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');
  const examId = searchParams.get('exam_id');
  const [data, setData] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!studentId || !examId) {
        setError('student_id and exam_id are required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/parent/report-cards?student_id=${studentId}&exam_id=${examId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load report card');
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load report card');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [examId, studentId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading report card...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Report Card</h2>
        <p className="text-sm text-muted-foreground">Academic performance summary</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && data && (
        <div className="space-y-6 rounded-lg border bg-card p-6">
          <div className="space-y-1">
            <p className="font-semibold">{data.student.name}</p>
            <p className="text-sm text-muted-foreground">{data.student.student_id} • {data.student.class}</p>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Exam</p>
            <p className="font-semibold">{data.exam.name}</p>
            <p className="text-sm text-muted-foreground">{data.exam.date ? new Date(data.exam.date).toLocaleDateString() : '—'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-xl font-semibold">{data.summary.overallPercentage}%</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className="text-xl font-semibold">{data.summary.overallGrade}</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Pass/Fail</p>
              <p className="text-xl font-semibold">{data.summary.passed === null ? '—' : data.summary.passed ? 'Pass' : 'Fail'}</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.subjects.map((subject) => (
              <div key={`${subject.code}-${subject.subject}`} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <p className="text-sm text-muted-foreground">{subject.code}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{subject.marks}/{subject.maxMarks}</p>
                    <p className="text-muted-foreground">{subject.percentage}% • {subject.grade}</p>
                  </div>
                </div>
                {subject.remarks && <p className="mt-2 text-sm text-muted-foreground">{subject.remarks}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
