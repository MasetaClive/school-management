'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ReportData = {
    student: { name: string; student_id: string; class: string };
    exam: { name: string; date: string; academic_year: string };
    subjects: Array<{
        subject: string;
        code: string;
        marks: number;
        maxMarks: number;
        percentage: number;
        grade: string;
        remarks: string;
    }>;
    summary: {
        totalObtained: number;
        totalMax: number;
        overallPercentage: number;
        overallGrade: string;
    };
};

function StudentReportCardPageContent({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);
    const searchParams = useSearchParams();
    const examId = searchParams.get('exam_id');
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!examId) {
            setError('Missing exam_id');
            setLoading(false);
            return;
        }

        async function load() {
            try {
                const res = await fetch(`/api/admin/report-cards/${studentId}?exam_id=${examId}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load report');
                setReport(json);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [studentId, examId]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Generating report card...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!report) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-center no-print">
                <Link href="/admin/report-cards" className="text-sm font-medium hover:underline text-muted-foreground">
                    &larr; Back to Selection
                </Link>
                <button 
                    onClick={() => window.print()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Print Report Card
                </button>
            </div>

            <div className="bg-white border-2 border-primary rounded-xl overflow-hidden shadow-2xl print:shadow-none print:border-black p-8 sm:p-12 space-y-8 report-card-shadow">
                {/* Header */}
                <div className="text-center space-y-2 border-b-2 pb-6 border-muted print:border-black">
                    <h1 className="text-3xl font-black tracking-tight text-primary print:text-black uppercase">Official Student Report Card</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest">{report.exam.name} - {report.exam.academic_year}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pt-4">
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold text-muted-foreground uppercase text-xs">Student Name</span>
                            <span className="font-semibold">{report.student.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold text-muted-foreground uppercase text-xs">Student ID</span>
                            <span className="font-mono">{report.student.student_id}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold text-muted-foreground uppercase text-xs">Class</span>
                            <span className="font-semibold">{report.student.class}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold text-muted-foreground uppercase text-xs">Report Date</span>
                            <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Marks Table */}
                <div className="pt-4">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-secondary text-secondary-foreground print:bg-white print:text-black">
                                <th className="border border-muted print:border-black px-4 py-3 text-left font-bold uppercase tracking-wider text-xs">Subject</th>
                                <th className="border border-muted print:border-black px-4 py-3 text-center font-bold uppercase tracking-wider text-xs">Marks</th>
                                <th className="border border-muted print:border-black px-4 py-3 text-center font-bold uppercase tracking-wider text-xs">Max</th>
                                <th className="border border-muted print:border-black px-4 py-3 text-center font-bold uppercase tracking-wider text-xs">%</th>
                                <th className="border border-muted print:border-black px-4 py-3 text-center font-bold uppercase tracking-wider text-xs">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.subjects.map((s, i) => (
                                <tr key={i} className="hover:bg-muted/30">
                                    <td className="border border-muted print:border-black px-4 py-3 font-medium">{s.subject}</td>
                                    <td className="border border-muted print:border-black px-4 py-3 text-center font-mono">{s.marks}</td>
                                    <td className="border border-muted print:border-black px-4 py-3 text-center font-mono text-muted-foreground">{s.maxMarks}</td>
                                    <td className="border border-muted print:border-black px-4 py-3 text-center font-mono">{s.percentage}%</td>
                                    <td className="border border-muted print:border-black px-4 py-3 text-center font-bold text-primary print:text-black">{s.grade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Table */}
                <div className="flex justify-end pt-4">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="grid grid-cols-2 bg-primary/5 p-4 rounded-lg border border-primary/20 print:bg-white print:border-black">
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Total Marks</p>
                                <p className="text-xl font-bold">{report.summary.totalObtained} / {report.summary.totalMax}</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Overall Grade</p>
                                <p className="text-3xl font-black text-primary print:text-black">{report.summary.overallGrade}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-4">
                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Result Status:</span>
                            <span className={`text-lg font-black uppercase ${report.summary.overallPercentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                                {report.summary.overallPercentage >= 40 ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="pt-16 grid grid-cols-2 gap-16 text-center text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    <div className="border-t pt-4 border-muted print:border-black">Class Teacher</div>
                    <div className="border-t pt-4 border-muted print:border-black">Principal</div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .report-card-shadow { box-shadow: none !important; }
                    @page { margin: 1in; }
                }
                .report-card-shadow {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    );
}

export default function StudentReportCardPage({ params }: { params: Promise<{ studentId: string }> }) {
    return (
        <Suspense fallback={null}>
            <StudentReportCardPageContent params={params} />
        </Suspense>
    );
}
