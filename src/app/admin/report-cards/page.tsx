'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Student = {
    id: string;
    full_name: string;
    student_id: string;
    class: { name: string };
};

type Exam = {
    id: string;
    name: string;
    academic_year: string;
};

export default function ReportCardsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [studentsRes, examsRes] = await Promise.all([
                    fetch('/api/admin/students'),
                    fetch('/api/admin/exams')
                ]);

                const studentsData = await studentsRes.json();
                const examsData = await examsRes.json();

                setStudents(studentsData.data || []);
                setExams(examsData.data || []);
                
                if (examsData.data?.length > 0) {
                    setSelectedExam(examsData.data[0].id);
                }
            } catch (e) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Report Cards</h2>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Select Exam:</label>
                    <select 
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>
                                {exam.name} ({exam.academic_year})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && (
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="min-w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Student ID</th>
                                <th className="px-4 py-2 text-left">Full Name</th>
                                <th className="px-4 py-2 text-left">Class</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-t">
                                    <td className="px-4 py-2 font-mono">{student.student_id}</td>
                                    <td className="px-4 py-2 font-medium">{student.full_name}</td>
                                    <td className="px-4 py-2">{student.class?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <Link
                                            href={`/admin/report-cards/${student.id}?exam_id=${selectedExam}`}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            View Report Card
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
